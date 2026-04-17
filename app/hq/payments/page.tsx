'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useHqPayments } from '../hooks/use-hq-data';
import { HqPageSkeleton } from '../components/ui/HqPageSkeleton';
import { GlassCard } from '../components/ui/GlassCard';
import { DiagnosticAlert } from '../components/ui/DiagnosticAlert';

/**
 * NEXUS COMMAND: Financial Settlement.
 * Manual verification queue for UPI/Bank-transfer subscription requests.
 * Refactored with high-fidelity cards and SWR integration.
 */
export default function PaymentsVerification() {
  const { payments, isLoading, isError, mutate } = useHqPayments();

  async function handleVerification(requestId: string, status: 'APPROVED' | 'REJECTED') {
    const notes = prompt(`Enter ${status} notes (optional):`) || '';
    const res = await fetch('/hq/api/superadmin/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, status, notes }),
    });
    const data = await res.json();
    if (data.success) {
      mutate();
    }
  }

  if (isLoading) return <HqPageSkeleton />;

  if (isError) return (
    <div className="p-20">
      <DiagnosticAlert 
        severity="critical"
        title="Financial Link Failure"
        message="The settlement ledger is currently offline. Synchronous verification of incoming transactions is suspended."
      />
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-10 space-y-12 max-w-[1600px] mx-auto"
    >
      <section>
        <h2 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-2 pl-1">Financial Settlement</h2>
        <motion.h1 
          initial={{ x: -20 }}
          animate={{ x: 0 }}
          className="text-4xl font-black text-white tracking-tighter"
        >
          Verification Queue
        </motion.h1>
      </section>

      {payments.length === 0 ? (
        <GlassCard className="p-32 text-center">
           <motion.span 
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="text-6xl block mb-8 opacity-50"
          >
            🛡️
          </motion.span>
           <h3 className="text-2xl font-black text-white tracking-tight mb-2">Queue Depleted</h3>
           <p className="text-slate-500 text-xs font-black uppercase tracking-widest">No pending financial settlements found at this time.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {payments.map((req: any, idx: number) => (
            <GlassCard key={req.id} className="p-8 group hq-panel-entrance" style={{ animationDelay: `${idx * 100}ms` }}>
               <div className="absolute top-0 right-0 p-8 opacity-5 font-black text-7xl pointer-events-none transition-all group-hover:scale-110 group-hover:opacity-10 group-hover:rotate-12">
                 ₹
               </div>
               <header className="mb-8">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Node Identity: {req.tenant_name}</p>
                 <h4 className="text-3xl font-black text-white tracking-tight group-hover:text-emerald-400 transition-colors">
                   ₹{parseFloat(req.amount).toLocaleString()}
                 </h4>
                 <p className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest mt-2">{req.transaction_id || 'REFERENCE_PENDING'}</p>
               </header>

               <div className="space-y-6 pt-6 border-t border-white/5">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <span>Requested Tier:</span>
                    <span className="text-white bg-white/5 px-3 py-1 rounded-lg border border-white/5">{req.plan_id}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <span>Submission Time:</span>
                    <span className="text-slate-400 font-mono">{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 mt-10">
                 <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleVerification(req.id, 'APPROVED')}
                  className="bg-emerald-500 text-emerald-950 font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl hover:bg-emerald-400 shadow-xl shadow-emerald-500/20 transition-all"
                 >
                   Approve
                 </motion.button>
                 <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleVerification(req.id, 'REJECTED')}
                  className="bg-red-500/10 text-red-500 border border-red-500/10 font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl hover:bg-red-500/20 transition-all"
                 >
                   Reject
                 </motion.button>
               </div>
            </GlassCard>
          ))}
        </div>
      )}
    </motion.div>
  );
}
