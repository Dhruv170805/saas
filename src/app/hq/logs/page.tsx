'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/features/hq/components/ui/GlassCard';
import { ResourceTable } from '@/features/hq/components/ui/ResourceTable';

/**
 * NEXUS COMMAND: Audit Logs.
 * High-fidelity system activity monitoring.
 */
export default function AuditLogsPage() {
  // Placeholder logs for demonstration of the new UI
  const logs = [
    { id: 1, event: 'AUTH_SUCCESS', actor: 'Dhruv (SuperAdmin)', target: 'HQ_BRIDGE', timestamp: '2026-04-17 10:42:01', status: 'SUCCESS' },
    { id: 2, event: 'TENANT_SUSPEND', actor: 'Dhruv (SuperAdmin)', target: 'Omega_Corp', timestamp: '2026-04-17 10:38:15', status: 'SUCCESS' },
    { id: 3, event: 'API_KEY_ROTATION', actor: 'SYSTEM_BOT', target: 'Cluster_Alpha', timestamp: '2026-04-17 10:15:42', status: 'SUCCESS' },
    { id: 4, event: 'GATEWAY_TIMEOUT', actor: 'WHATSAPP_SVC', target: 'QR_ENGINE', timestamp: '2026-04-17 10:02:11', status: 'WARNING' },
    { id: 5, event: 'DB_BACKUP_INIT', actor: 'SYSTEM_BOT', target: 'S3_VAULT', timestamp: '2026-04-17 09:00:00', status: 'SUCCESS' },
  ];

  const columns = [
    {
      header: 'Timestamp',
      render: (log: any) => <span className="font-mono text-[10px] text-slate-500">{log.timestamp}</span>
    },
    {
      header: 'Event Directive',
      render: (log: any) => (
        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
          log.status === 'WARNING' ? 'bg-amber-500/10 text-amber-500' : 'bg-cyan-500/10 text-cyan-400'
        }`}>
          {log.event}
        </span>
      )
    },
    {
      header: 'Initiator',
      render: (log: any) => <span className="text-white font-bold text-xs">{log.actor}</span>
    },
    {
      header: 'Target Sector',
      render: (log: any) => <span className="text-slate-400 font-mono text-[10px]">{log.target}</span>
    },
    {
      header: 'Operational Status',
      className: 'text-right pr-12',
      render: (log: any) => (
        <span className={`text-[10px] font-black uppercase tracking-widest ${
          log.status === 'SUCCESS' ? 'text-emerald-500' : 'text-amber-500'
        }`}>
          {log.status}
        </span>
      )
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-10 space-y-12 max-w-[1600px] mx-auto"
    >
      <section>
        <h2 className="text-[10px] font-black text-magenta-500 uppercase tracking-[0.4em] mb-2 pl-1">Infrastructure Telemetry</h2>
        <motion.h1 
          initial={{ x: -20 }}
          animate={{ x: 0 }}
          className="text-4xl font-black text-white tracking-tighter"
        >
          Audit Ledger
        </motion.h1>
      </section>

      <ResourceTable 
        title="Command Engine Event History"
        data={logs}
        columns={columns}
      />

      <GlassCard className="p-8 bg-black/40 border-dashed border-white/10">
        <div className="flex items-center gap-6">
           <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-2xl">📥</div>
           <div>
             <h4 className="text-white font-black text-sm uppercase tracking-widest">Historical Data Extraction</h4>
             <p className="text-slate-500 text-xs mt-1">Export full audit trail to encrypted CSV for regulatory compliance.</p>
           </div>
           <button className="ml-auto px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Download Matrix</button>
        </div>
      </GlassCard>
    </motion.div>
  );
}
