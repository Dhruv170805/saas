'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { GlassCard } from '../ui/GlassCard';

const data = [
  { name: '00:00', val: 1200 }, { name: '01:00', val: 3200 }, { name: '02:00', val: 4500 },
  { name: '03:00', val: 2800 }, { name: '04:00', val: 1800 }, { name: '05:00', val: 3800 },
  { name: '06:00', val: 5100 }, { name: '07:00', val: 6200 }, { name: '08:00', val: 4200 },
  { name: '09:00', val: 3100 }, { name: '10:00', val: 4800 }, { name: '11:00', val: 7200 },
  { name: '12:00', val: 6800 }, { name: '13:00', val: 5400 }, { name: '14:00', val: 8500 },
];

/**
 * MetricsHistogram: High-fidelity "Throughput Metrics" center console.
 * Recreates the glowing cyan bars from Reference Image 1 using Vanilla CSS.
 */
export const MetricsHistogram: React.FC = () => {
  return (
    <GlassCard className="hq-p-10" style={{ height: '28rem' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, padding: '2.5rem', display: 'flex', gap: '1rem' }}>
         <Pill active>1H</Pill>
         <Pill>24H</Pill>
         <Pill>7D</Pill>
      </div>
      
      <header style={{ marginBottom: '2.5rem' }}>
        <h3 className="hq-text-lg hq-font-black hq-text-white hq-tracking-tighter">Throughput Metrics</h3>
        <p className="hq-text-xs hq-text-dim hq-font-black hq-uppercase hq-tracking-widest" style={{ marginTop: '0.25rem' }}>REALTIME_REQ/S</p>
      </header>

      <div style={{ height: '17.5rem', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="name" hide />
            <YAxis hide domain={[0, 10000]} />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.02)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div style={{ background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '0.75rem', backdropFilter: 'blur(20px)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                      <p className="hq-text-xs hq-text-dim hq-font-black hq-uppercase hq-tracking-widest" style={{ marginBottom: '0.25rem' }}>{payload[0].payload.name}</p>
                      <p className="hq-text-lg hq-font-black hq-text-white hq-tracking-tighter">
                        {payload[0].value.toLocaleString()} <span style={{ fontSize: '10px', opacity: 0.4 }}>RDS</span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="val" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill="#00f2ff" 
                  fillOpacity={0.6}
                  style={{ filter: 'drop-shadow(0 0 8px rgba(0, 242, 255, 0.4))' }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ position: 'absolute', bottom: '2.5rem', left: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
         <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#1e293b' }}>1.2k</span>
         <div style={{ width: '3rem', height: '1px', background: 'rgba(255,255,255,0.05)' }} />
      </div>

      <div style={{ position: 'absolute', bottom: '2.5rem', right: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
         <div style={{ width: '3rem', height: '1px', background: 'rgba(255,255,255,0.05)' }} />
         <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#1e293b' }}>8.5k</span>
      </div>
    </GlassCard>
  );
};

const Pill = ({ children, active }: { children: React.ReactNode, active?: boolean }) => (
  <button style={{ 
    padding: '0.375rem 1rem', 
    borderRadius: '0.5rem', 
    fontSize: '9px', 
    fontWeight: 900, 
    textTransform: 'uppercase', 
    letterSpacing: '0.1em',
    transition: 'all 0.3s ease',
    border: active ? '1px solid rgba(0,242,255,0.3)' : '1px solid rgba(255,255,255,0.05)',
    background: active ? 'rgba(0,242,255,0.2)' : 'rgba(255,255,255,0.05)',
    color: active ? 'var(--glow-cyan)' : 'var(--text-dim)',
    cursor: 'pointer'
  }}>
    {children}
  </button>
);
