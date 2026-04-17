'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useHqAnalytics } from './hooks/use-hq-data';
import { HqPageSkeleton } from './components/ui/HqPageSkeleton';
import { DiagnosticAlert } from './components/ui/DiagnosticAlert';
import { StatCard } from './components/dashboard/StatCard';
import { SystemVitals } from './components/dashboard/SystemVitals';
import { NodeControlTile } from './components/dashboard/NodeControlTile';
import { MetricsHistogram } from './components/dashboard/MetricsHistogram';
import { SystemTerminal } from './components/dashboard/SystemTerminal';
import { GlassCard } from './components/ui/GlassCard';
import { 
  Users, 
  TrendingUp, 
  Globe, 
  AlertTriangle
} from 'lucide-react';

/**
 * NEXUS COMMAND: Global Platform Dashboard (God-Mode).
 * Migrated to Vanilla CSS (HQ System).
 */
export default function HQDashboard() {
  const { analytics, isLoading, isError } = useHqAnalytics();

  if (isLoading) return <HqPageSkeleton />;

  if (isError) return (
    <div className="hq-py-10">
      <DiagnosticAlert 
        severity="critical"
        title="Identity Synchronization Failure"
        message="Unable to establish a secure link with the redundant backend clusters. Please check your credentials and network topology."
        onAction={() => window.location.reload()}
      />
    </div>
  );

  const stats = [
    { 
      label: 'Active Tenants', 
      value: (analytics?.tenants || []).reduce((sum: number, t: any) => sum + parseInt(t.count || '0'), 0).toLocaleString(), 
      trend: '+12 today', 
      icon: <Users size={24} className="hq-text-cyan" />, 
      color: 'var(--glow-cyan)' 
    },
    { 
      label: 'MRR', 
      value: `$${(parseFloat(analytics?.revenue30d || '0') / 85).toLocaleString()}k`, 
      trend: '+4.2%', 
      icon: <TrendingUp size={24} className="hq-text-magenta" />, 
      color: 'var(--purple-mrr)' 
    },
    { 
      label: 'API Req/Sec', 
      value: '8.5k', 
      trend: 'Steady', 
      icon: <Globe size={24} className="hq-text-cyan" />, 
      color: 'var(--glow-cyan)' 
    },
    { 
      label: 'Error Rate', 
      value: '0.04%', 
      trend: 'Elevated', 
      icon: <AlertTriangle size={24} style={{ color: 'var(--warning-orange)' }} />, 
      color: 'var(--warning-orange)' 
    },
  ];

  const vitals = [
    { name: 'PostgreSQL Cluster', status: 'ONLINE', color: '#10b981' },
    { name: 'Nginx Gateway', status: 'ONLINE', color: '#10b981' },
    { name: 'NestJS Command Engine', status: 'ONLINE', color: '#10b981' },
    { name: 'Redis Cache', status: 'DOWN', color: '#ef4444' },
    { name: 'Auth Service (Kratos)', status: 'ONLINE', color: '#10b981' },
    { name: 'Message Broker (Kafka)', status: 'ONLINE', color: '#10b981' },
  ];

  const nodes = [
    { id: 'TID-8902', name: 'Omega Corp', load: 42, latency: '12', status: 'Optimal' as const },
    { id: 'TID-441B', name: 'Nexus Industries', load: 88, latency: '45', status: 'Heavy Load' as const },
    { id: 'TID-981X', name: 'Aero Dynamics', load: 99, latency: '120', status: 'Throttled' as const },
    { id: 'TID-220C', name: 'Global Data Inc', load: 15, latency: '8', status: 'Optimal' as const },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="hq-flex-col hq-gap-10"
    >
      {/* ── ROW 0: URGENT DIAGNOSTICS ────────────────────────────────────────── */}
      <DiagnosticAlert 
        severity="critical"
        title="Platform Connection Lost"
        message="Internal Server Error detected on Cluster Alpha-09. Automatic failover initiated but degraded performance expected."
        onAction={() => {}}
      />

      {/* ── ROW 1: PRIMARY METRICS ────────────────────────────────────────────── */}
      <div className="hq-grid-stats">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* ── ROW 2: THROUGHPUT & VITALS ───────────────────────────────────────── */}
      <div className="hq-main-grid">
        <div className="hq-col-8">
          <MetricsHistogram />
        </div>
        <div className="hq-col-4">
          <SystemVitals vitals={vitals} />
        </div>
      </div>

      {/* ── ROW 3: NODE CONTROL & AI INSIGHTS ─────────────────────────────────── */}
      <div className="hq-main-grid">
        <div className="hq-col-8 hq-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
           <header style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 className="hq-text-xs hq-font-black hq-text-white hq-uppercase hq-tracking-widest">Tenant Control Top Nodes</h3>
              <button style={{ fontSize: '10px', color: 'var(--glow-cyan)', fontWeight: 900, textTransform: 'uppercase', background: 'transparent', border: 'none', cursor: 'pointer' }}>View All Matrix →</button>
           </header>
           {nodes.map((node, i) => (
             <NodeControlTile key={i} {...node} />
           ))}
        </div>
        <div className="hq-col-4">
          <div className="hq-glass-card hq-p-10 hq-flex-col hq-gap-4" style={{ height: '100%', borderLeft: '4px solid rgba(255, 0, 255, 0.4)' }}>
            <header className="hq-flex hq-items-center hq-gap-2" style={{ marginBottom: '2rem' }}>
              <div style={{ width: '0.5rem', height: '0.5rem', background: 'var(--glow-magenta)', borderRadius: '50%' }} />
              <h3 className="hq-text-xs hq-font-black hq-text-magenta hq-uppercase hq-tracking-widest">AI Sentinel Insights</h3>
            </header>
            <div className="hq-flex-col hq-gap-6">
              <div className="hq-p-6" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                 <div className="hq-flex hq-justify-between hq-items-start" style={{ marginBottom: '1rem' }}>
                    <p className="hq-text-cyan hq-text-xs hq-font-black hq-uppercase hq-tracking-widest">Anomaly Detected</p>
                    <span className="hq-text-dim hq-text-xs" style={{ fontFamily: 'monospace' }}>2m ago</span>
                 </div>
                 <p className="hq-text-white" style={{ fontSize: '12px', opacity: 0.8, lineHeight: 1.6 }}>
                   Spike in database read operations from US-East region. Suggesting horizontal scaling of read replicas.
                 </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 4: SYSTEM TERMINAL ────────────────────────────────────────────── */}
      <div style={{ paddingBottom: '2.5rem' }}>
        <SystemTerminal />
      </div>
    </motion.div>
  );
}
