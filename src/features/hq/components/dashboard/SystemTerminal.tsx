'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Filter, Pause, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard';

interface LogLine {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SYSTEM' | 'GET' | 'POST';
  message: string;
}

const INITIAL_LOGS: LogLine[] = [
  { id: '1', timestamp: '14:02:40', level: 'INFO', message: 'Worker thread #42 initialized successfully.' },
  { id: '2', timestamp: '14:02:42', level: 'GET', message: '/api/v1/metrics/throughput 200 OK (12ms)' },
  { id: '3', timestamp: '14:02:45', level: 'POST', message: '/api/v1/auth/verify 200 OK (45ms)' },
  { id: '4', timestamp: '14:02:47', level: 'WARN', message: 'Connection timeout to relay server at sector 7G. Retrying (1/3)...' },
];

/**
 * SystemTerminal: Bottom-docked console monitor.
 * Migrated to Vanilla CSS (HQ System).
 */
export const SystemTerminal: React.FC = () => {
  const [logs, setLogs] = useState<LogLine[]>(INITIAL_LOGS);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const newLog: LogLine = {
        id: Math.random().toString(36),
        timestamp: new Date().toLocaleTimeString([], { hour12: false }),
        level: ['INFO', 'GET', 'POST', 'WARN'][Math.floor(Math.random() * 4)] as any,
        message: generateMockMessage(),
      };
      setLogs(prev => [...prev.slice(-49), newLog]);
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused]);

  useEffect(() => {
    if (scrollRef.current && !isPaused) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  return (
    <div className="hq-terminal">
      <header className="hq-flex hq-items-center hq-justify-between hq-px-6 hq-py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
        <div className="hq-flex hq-items-center hq-gap-2">
           <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: 'var(--glow-cyan)', boxShadow: '0 0 8px #00f2ff' }} />
           <h3 className="hq-text-cyan hq-font-black hq-uppercase hq-tracking-widest" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
             sys_logs <span style={{ color: '#1a1a1a' }}>//</span> tail -f
           </h3>
        </div>
        <div className="hq-flex hq-items-center hq-gap-4">
           <button style={{ color: '#334155', background: 'transparent', border: 'none', cursor: 'pointer' }}><Filter size={14} /></button>
           <button 
            onClick={() => setIsPaused(!isPaused)}
            style={{ color: isPaused ? 'var(--glow-cyan)' : '#334155', background: 'transparent', border: 'none', cursor: 'pointer' }}
           >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
           </button>
        </div>
      </header>
      
      <div 
        ref={scrollRef}
        className="hq-terminal-content hq-gap-2"
        style={{ scrollBehavior: 'smooth' }}
      >
        <AnimatePresence mode="popLayout">
          {logs.map((log) => (
            <motion.div 
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="hq-flex hq-gap-4 terminal-line"
              style={{ paddingBottom: '0.25rem' }}
            >
              <span className="hq-text-dim" style={{ flexShrink: 0 }}>[{log.timestamp}]</span>
              <span className={`hq-font-black ${getLevelColorClass(log.level)}`} style={{ flexShrink: 0, width: '3rem' }}>
                {log.level}
              </span>
              <span style={{ color: log.level === 'WARN' ? 'var(--warning-orange)' : log.level === 'ERROR' ? 'var(--alert-red)' : 'var(--text-dim)', opacity: 0.8 }}>
                {log.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

function generateMockMessage() {
  const msgs = [
    'Worker: invoice-pdf job #824 completed.',
    'Worker: debt-recovery scan finished — 0 debts found.',
    'Auth: SuperAdmin login successful — IP 127.0.0.1.',
    'Auth: TOTP 2FA challenge initiated.',
    'DB: Multi-tenant isolation enforced via RLS.',
    'DB: PostgreSQL migration "add-reminder-column" applied.',
    'System: Monitoring heartbeat [OK].',
    'Network: Nginx upstream health check — [HEALTHY].',
    'Security: JWT access token rotated.',
    'Storage: Invoice PDF uploaded to MinIO bucket.',
  ];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

function getLevelColorClass(level: string) {
  switch (level) {
    case 'INFO': return 'hq-text-cyan';
    case 'WARN': return 'hq-text-orange';
    case 'ERROR': return 'hq-text-red';
    case 'GET': return 'hq-text-emerald';
    case 'POST': return 'hq-text-magenta';
    case 'SYSTEM': return 'hq-text-white';
    default: return 'hq-text-dim';
  }
}
