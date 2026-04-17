'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Users, 
  CreditCard, 
  ShieldCheck, 
  Cpu, 
  History, 
  LogOut, 
  Power 
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { HqGlobalHeader } from './ui/HqGlobalHeader';

/**
 * HqSidebarLayout: High-fidelity executive shell.
 * Migrated to Vanilla CSS (HQ System) for cross-environment stability.
 */
export default function HqSidebarLayout({ children, session }: { children: React.ReactNode, session: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState<string | null>(null);

  const navItems = [
    { label: 'Core', href: '/hq', icon: <Activity size={20} /> },
    { label: 'Tenant Control', href: '/hq/tenants', icon: <Users size={20} /> },
    { label: 'Financial', href: '/hq/payments', icon: <CreditCard size={20} /> },
    { label: 'Security', href: '/hq/subscriptions', icon: <ShieldCheck size={20} /> },
    { label: 'System', href: '/hq/logs', icon: <Cpu size={20} /> },
  ];

  const handleLogout = async () => {
    await fetch('/hq/api/superadmin/auth/logout', { method: 'POST' });
    router.push('/hq/login');
  };

  return (
    <div className="hq-layout hq-flex hq-items-start" style={{ minHeight: '100vh', background: 'var(--node-black)', color: 'white', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      
      {/* GLOBAL COMMAND SIDEBAR */}
      <aside className="hq-sidebar hq-flex-col">
        <header className="hq-p-10">
          <h2 className="hq-text-xs hq-font-black hq-text-dim hq-uppercase hq-tracking-widest" style={{ marginBottom: '0.25rem' }}>Command</h2>
          <p className="hq-text-xs hq-font-black hq-text-cyan hq-uppercase" style={{ fontSize: '8px', opacity: 0.6, letterSpacing: '0.2em' }}>Level 01 Access</p>
        </header>

        <nav className="hq-flex-col hq-gap-2" style={{ flex: 1, padding: '0 1rem' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <motion.div
                  onHoverStart={() => setIsHovered(item.href)}
                  onHoverEnd={() => setIsHovered(null)}
                  style={{ 
                    position: 'relative', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem', 
                    padding: '1rem 1.5rem', 
                    borderRadius: '1rem', 
                    transition: 'all 0.3s ease',
                    background: isActive ? 'rgba(0,242,255,0.05)' : 'transparent',
                    color: isActive ? 'var(--glow-cyan)' : 'var(--text-dim)',
                    border: isActive ? '1px solid rgba(0,242,255,0.1)' : '1px solid transparent'
                  }}
                >
                  <AnimatePresence>
                    {(isActive || isHovered === item.href) && (
                      <motion.div
                        layoutId="activePill"
                        className="hq-glow-cyan"
                        style={{ 
                          position: 'absolute', 
                          left: 0, 
                          width: '2px', 
                          height: '1.5rem', 
                          background: 'var(--glow-cyan)', 
                          borderRadius: '0 100px 100px 0' 
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      />
                    )}
                  </AnimatePresence>

                  <span style={{ position: 'relative', zIndex: 10 }}>
                    {item.icon}
                  </span>
                  <span className="hq-text-xs hq-font-black hq-uppercase hq-tracking-widest" style={{ position: 'relative', zIndex: 10 }}>
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="hq-p-6 hq-flex-col hq-gap-4" style={{ marginBottom: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
          <Link href="/hq/logs" className="hq-flex hq-items-center hq-gap-4 hq-px-6 hq-text-dim hq-uppercase" style={{ textDecoration: 'none', fontSize: '10px', fontWeight: 900 }}>
            <History size={18} />
            <span>Logs</span>
          </Link>

          <button 
            onClick={handleLogout}
            className="hq-flex hq-items-center hq-gap-4 hq-px-6 hq-text-dim hq-uppercase" 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '10px', fontWeight: 900 }}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>

          {/* KILL SWITCH: EMERGENCY TERMINATION */}
          <button onClick={handleLogout} className="hq-kill-switch">
             <Power size={18} />
             <span>Kill Switch</span>
          </button>
        </div>
      </aside>

      {/* CORE PLATFORM SURFACE */}
      <main className="hq-flex-col hq-items-stretch" style={{ flex: 1, height: '100vh', overflow: 'hidden' }}>
        <HqGlobalHeader />
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--node-black)', padding: '2.5rem' }}>
           <div style={{ maxWidth: '1800px', margin: '0 auto' }}>
              {children}
           </div>
        </div>
      </main>
    </div>
  );
}
