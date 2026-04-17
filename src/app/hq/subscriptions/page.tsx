'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useHqAnalytics } from '@/features/hq/hooks/use-hq-data';
import { HqPageSkeleton } from '@/features/hq/components/ui/HqPageSkeleton';
import { GlassCard } from '@/features/hq/components/ui/GlassCard';
import { DiagnosticAlert } from '@/features/hq/components/ui/DiagnosticAlert';
import { ShieldCheck, ArrowUpRight, Zap } from 'lucide-react';

/**
 * NEXUS COMMAND: Fleet Lifecycle (Subscriptions).
 * Migrated to Vanilla CSS (HQ System).
 */
export default function SubscriptionsDashboard() {
  const { analytics, isLoading, isError, isSimulation } = useHqAnalytics();

  if (isLoading) return <HqPageSkeleton />;

  if (isError) return (
    <div className="hq-py-10">
      <DiagnosticAlert 
        severity="critical"
        title="Lifecycle Data Desync"
        message="The subscription registry is currently inaccessible. Fleet saturation reports are unavailable."
      />
    </div>
  );

  const tiers = analytics?.tenants || [];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="hq-flex-col hq-gap-10"
    >
      <section>
        <h2 className="hq-text-xs hq-font-black hq-text-magenta hq-uppercase hq-tracking-widest" style={{ marginBottom: '0.5rem' }}>Subscription Matrix</h2>
        <h1 className="hq-text-4xl hq-font-black hq-text-white hq-tracking-tighter">Fleet Lifecycle</h1>
      </section>

      <div className="hq-grid hq-gap-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
        {tiers.map((tier: any, i: number) => {
          const planName = tier.plan || 'UNKNOWN';
          return (
            <GlassCard key={i} className="hq-p-10" hoverGlow>
              <div 
                style={{ 
                  position: 'absolute', 
                  top: '-2.5rem', 
                  right: '-2.5rem', 
                  width: '10rem', 
                  height: '10rem', 
                  background: 'rgba(139, 92, 246, 0.05)', 
                  filter: 'blur(60px)', 
                  borderRadius: '50%',
                  pointerEvents: 'none'
                }} 
              />
              
              <header style={{ marginBottom: '2rem' }}>
                <div className="hq-flex hq-items-center hq-gap-2" style={{ marginBottom: '1rem' }}>
                   <ShieldCheck size={14} className="hq-text-magenta" />
                   <h3 className="hq-text-xs hq-font-black hq-text-magenta hq-uppercase hq-tracking-widest">
                     {planName.toUpperCase()} TIER
                   </h3>
                </div>

                <div className="hq-flex hq-items-end hq-gap-2 hq-text-white">
                  <span className="hq-text-4xl hq-font-black hq-tracking-tighter hq-text-white">
                    {tier.count}
                  </span>
                  <span className="hq-text-xs hq-font-black hq-uppercase hq-tracking-widest hq-text-dim" style={{ marginBottom: '0.5rem' }}>Units Active</span>
                </div>
              </header>

              <div className="hq-flex-col hq-gap-6" style={{ paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="hq-flex hq-justify-between hq-items-center">
                  <span className="hq-text-xs hq-font-black hq-text-dim hq-uppercase hq-tracking-widest">Fleet Saturation</span>
                  <span className="hq-text-xs hq-font-black hq-text-white hq-uppercase hq-tracking-widest" style={{ color: 'var(--emerald-success)' }}>Optimal</span>
                </div>
                
                <div style={{ height: '0.375rem', width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', overflow: 'hidden' }}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: i * 0.2 }}
                    style={{ 
                      height: '100%', 
                      background: 'var(--purple-mrr)',
                      boxShadow: '0 0 10px rgba(139, 92, 246, 0.4)' 
                    }}
                  />
                </div>

                <div className="hq-flex hq-items-center hq-gap-4" style={{ marginTop: '1rem' }}>
                  <button style={{ 
                    flex: 1, 
                    padding: '0.75rem', 
                    borderRadius: '0.75rem', 
                    background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid rgba(255,255,255,0.05)',
                    color: 'white',
                    fontSize: '9px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    cursor: 'pointer'
                  }}>
                    View Registry
                  </button>
                  <button style={{ 
                    width: '2.5rem', 
                    height: '2.5rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    borderRadius: '0.75rem', 
                    background: 'rgba(139, 92, 246, 0.1)', 
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    color: 'var(--purple-mrr)',
                    cursor: 'pointer'
                  }}>
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {isSimulation && (
        <div className="hq-flex hq-items-center hq-gap-2 hq-p-6 hq-glass-card" style={{ background: 'rgba(139, 92, 246, 0.05)', borderColor: 'rgba(139, 92, 246, 0.1)' }}>
           <Zap size={14} className="hq-text-magenta" />
           <p className="hq-text-xs hq-font-black hq-text-magenta hq-uppercase hq-tracking-widest">
             Simulation Engine active. Subscription metrics derived from platform projections.
           </p>
        </div>
      )}
    </motion.div>
  );
}
