import React from 'react';
import { GlassCard } from '../ui/GlassCard';

interface Vital {
  name: string;
  status: string;
  color: string;
}

interface SystemVitalsProps {
  vitals: Vital[];
}

/**
 * SystemVitals: Real-time telemetry for platform infrastructure.
 */
export const SystemVitals: React.FC<SystemVitalsProps> = ({ vitals }) => {
  return (
    <GlassCard className="p-10 h-fit">
      <header className="flex justify-between items-center mb-10">
        <h3 className="text-xl font-black text-white tracking-tight">System Vitals</h3>
        <span className="text-[10px] text-slate-500 uppercase font-black cursor-help"> telemetry_active </span>
      </header>
      
      <div className="space-y-8">
        {vitals.map((vital, i) => (
          <div key={i} className="flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div 
                className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" 
                style={{ 
                  backgroundColor: vital.color, 
                  boxShadow: `0 0 10px ${vital.color}50` 
                }} 
              />
              <span className="text-xs font-black text-slate-400 group-hover:text-white transition-colors">
                {vital.name}
              </span>
            </div>
            <span 
              className="text-[9px] font-mono font-bold tracking-widest uppercase opacity-80" 
              style={{ color: vital.color }}
            >
              {vital.status}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-12 p-6 bg-black/40 border border-white/5 rounded-3xl font-mono text-[9px] space-y-2 opacity-40">
         <p className="text-cyan-500">[14:02:40] Worker thread #42 active.</p>
         <p className="text-emerald-500">[14:02:45] DB read latency 12ms.</p>
         <p className="text-magenta-500">[14:02:50] Cache hit ratio 98.4%.</p>
         <p className="text-red-500">[14:02:55] Alert: Connection timeout Sector 7G.</p>
      </div>
    </GlassCard>
  );
};
