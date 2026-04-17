'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { ShieldCheck, Fingerprint, Lock, Mail, Loader2, Cpu } from 'lucide-react';

/**
 * NEXUS COMMAND: Executive Identity Gateway.
 * High-fidelity, Vanilla CSS powered executive authentication portal.
 */
export default function HQLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpRequired, setTotpRequired] = useState(false);
  const [totp, setTotp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bootSequence, setBootSequence] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setBootSequence(true), 100);
    return () => clearTimeout(timer);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/hq/api/superadmin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, ...(totpRequired ? { totp } : {}) }),
      });

      const data = await res.json();

      if (res.status === 401 && data.totpRequired) {
        setTotpRequired(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.error || 'Identity Verification Failed');
        setLoading(false);
        return;
      }

      router.push('/hq');
      router.refresh();
    } catch (err) {
      setError('Bridge Failure: Could not reach Identity Plane.');
      setLoading(false);
    }
  }

  return (
    <div className="hq-auth-canvas">
      {/* Background Cinematic Atmos */}
      <div className="hq-auth-glow-1" />
      <div className="hq-auth-glow-2" />
      
      <AnimatePresence>
        {bootSequence && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="hq-auth-card"
          >
            <GlassCard className="hq-p-10" hoverGlow>
              <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <motion.div 
                  initial={{ rotate: -180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 1, type: 'spring' }}
                  className="hq-flex hq-items-center hq-justify-center"
                  style={{ 
                    width: '4rem', 
                    height: '4rem', 
                    background: 'rgba(0,242,255,0.05)', 
                    borderRadius: '1.25rem', 
                    border: '1px solid rgba(0,242,255,0.1)',
                    margin: '0 auto 1.5rem auto',
                    boxShadow: 'inset 0 0 15px rgba(0,242,255,0.1)'
                  }}
                >
                  <Cpu size={28} className="hq-text-cyan" />
                </motion.div>
                <h1 className="hq-text-3xl hq-font-black hq-text-white hq-tracking-tighter" style={{ margin: 0 }}>
                  NEXUS <span className="hq-text-cyan">COMMAND</span>
                </h1>
                <p className="hq-text-xs hq-font-black hq-text-dim hq-uppercase hq-tracking-widest" style={{ opacity: 0.4, marginTop: '0.5rem' }}>
                  Identity Gateway Sector 7
                </p>
              </header>

              <form onSubmit={handleLogin}>
                 {!totpRequired ? (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                     <div className="hq-input-group">
                        <label className="hq-text-xs hq-font-black hq-text-dim hq-uppercase hq-tracking-widest">Executive Email</label>
                        <div style={{ position: 'relative' }}>
                           <Mail size={16} className="hq-text-dim" style={{ position: 'absolute', left: '1rem', top: '1rem', opacity: 0.5, pointerEvents: 'none' }} />
                           <input 
                            type="email" 
                            className="hq-input hq-font-black" 
                            style={{ paddingLeft: '3rem' }}
                            placeholder="authorized_entity@nexus.io"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                           />
                        </div>
                     </div>

                     <div className="hq-input-group">
                        <label className="hq-text-xs hq-font-black hq-text-dim hq-uppercase hq-tracking-widest">Secure Credentials</label>
                        <div style={{ position: 'relative' }}>
                           <Lock size={16} className="hq-text-dim" style={{ position: 'absolute', left: '1rem', top: '1rem', opacity: 0.5, pointerEvents: 'none' }} />
                           <input 
                            type="password" 
                            className="hq-input hq-font-black" 
                            style={{ paddingLeft: '3rem' }}
                            placeholder="••••••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                           />
                        </div>
                     </div>
                   </motion.div>
                 ) : (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="hq-flex-col hq-gap-4 hq-p-6" style={{ background: 'rgba(0,242,255,0.03)', border: '1px solid rgba(0,242,255,0.1)', borderRadius: '1rem', marginBottom: '2rem', textAlign: 'center' }}>
                       <Fingerprint size={32} className="hq-text-cyan" style={{ margin: '0 auto' }} />
                       <div>
                          <p className="hq-text-sm hq-font-black hq-text-white hq-uppercase hq-tracking-widest">MFA Verification</p>
                          <p className="hq-text-xs hq-text-dim" style={{ marginTop: '0.25rem' }}>Enter the 6-digit synchronization code</p>
                       </div>
                       <input 
                        type="text" 
                        maxLength={6}
                        autoFocus
                        style={{ background: 'transparent', border: 'none', borderBottom: '2px solid var(--glow-cyan)', width: '100%', textAlign: 'center', fontSize: '2rem', fontWeight: 900, color: 'white', letterSpacing: '0.5em', outline: 'none' }}
                        value={totp}
                        onChange={(e) => setTotp(e.target.value.replace(/\D/g, ''))}
                       />
                    </motion.div>
                 )}

                 {error && (
                   <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.1)', color: 'var(--alert-red)', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', marginBottom: '1.5rem' }}>
                      ⚠️ {error}
                   </div>
                 )}

                 <button type="submit" disabled={loading} className="hq-login-btn hq-font-black">
                   {loading ? (
                     <div className="hq-flex hq-items-center hq-justify-center hq-gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        <span>Initializing...</span>
                     </div>
                   ) : (
                     'Initialize Command Bridge'
                   )}
                 </button>
              </form>

              <footer style={{ marginTop: '2rem', textAlign: 'center' }}>
                <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.05), transparent)', marginBottom: '1.5rem' }} />
                <p className="hq-text-xs hq-font-black hq-text-dim hq-uppercase hq-tracking-[0.4em]" style={{ fontSize: '8px' }}>
                  Secure_Link_Node_0x7F
                </p>
              </footer>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
