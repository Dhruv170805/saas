'use server';

import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState, 
  fetchLatestBaileysVersion 
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import path from 'path';
import fs from 'fs';
import pino from 'pino';

// -- Config --
const SESSION_DIR = path.join(process.cwd(), '.nexus/whatsapp-sessions');

// Ensure session directory exists
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

let sock: any = null;

/**
 * Initialize the WhatsApp Headless Gateway.
 * This is the "Zero-Cost" heart of our notification engine.
 */
export async function initWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' })
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update: any) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const statusCode = (lastDisconnect.error as Boom)?.output?.statusCode;
      // 🛡️ Stabilize: Don't auto-reconnect if QR attempts have timed out (408)
      // This prevents the infinite crashing loop observed in terminal.
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut && statusCode !== 408;
      
      console.log(`🔌 WhatsApp connection closed [Status: ${statusCode}]. Reconnecting: ${shouldReconnect}`);
      
      if (shouldReconnect) {
        initWhatsApp();
      } else if (statusCode === 408) {
        console.warn('⚠️ WhatsApp QR Timeout: Automatic reconnection suspended to preserve resources.');
      }
    } else if (connection === 'open') {
      console.log('✅ WhatsApp gateway connected successfully');
    }
  });

  return sock;
}

/**
 * Send a message via the WhatsApp gateway.
 */
export async function sendWhatsAppMessage(to: string, text: string) {
  if (!sock) await initWhatsApp();
  
  // Format number (strip +, add suffix if missing)
  const jid = to.replace(/\D/g, '') + '@s.whatsapp.net';
  
  try {
    const result = await sock.sendMessage(jid, { text });
    return result;
  } catch (err) {
    console.error(`❌ Failed to send WhatsApp to ${to}:`, err);
    throw err;
  }
}
