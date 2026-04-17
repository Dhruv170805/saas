'use client';

import React from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { GlassCard } from '../ui/GlassCard';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  icon: React.ReactNode;
  color?: string;
  chartData?: any[];
}

const DEFAULT_DATA = [
  { v: 40 }, { v: 60 }, { v: 45 }, { v: 70 }, 
  { v: 55 }, { v: 80 }, { v: 65 }, { v: 90 }
];

/**
 * StatCard: Multi-dimensional metric monitor with integrated area charts.
 * Migrated to Vanilla CSS (HQ System).
 */
export const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  value, 
  trend, 
  icon, 
  color = '#00f2ff',
  chartData = DEFAULT_DATA
}) => {
  return (
    <GlassCard className="hq-stat-card hq-p-8">
      <div className="hq-flex hq-justify-between hq-items-center" style={{ marginBottom: '0.5rem' }}>
        <p className="hq-text-xs hq-font-black hq-uppercase hq-tracking-widest hq-text-dim">
          {label}
        </p>
        <div style={{ opacity: 0.4 }}>
           {icon}
        </div>
      </div>
      
      <div style={{ position: 'relative', zIndex: 10 }}>
        <h4 className="hq-text-4xl hq-font-black hq-text-white hq-tracking-tighter">{value}</h4>
        {trend && (
           <p className="hq-font-black hq-uppercase hq-text-xs" style={{ color: trend.includes('+') ? 'var(--emerald-success)' : 'var(--warning-orange)', marginTop: '0.25rem' }}>
              {trend}
           </p>
        )}
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '5rem', pointerEvents: 'none', opacity: 0.5 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
             <defs>
                <linearGradient id={`color-${label}`} x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                   <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
             </defs>
             <XAxis hide dataKey="name" />
             <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
             <Area 
                type="monotone" 
                dataKey="v" 
                stroke={color} 
                strokeWidth={2}
                fillOpacity={1} 
                fill={`url(#color-${label})`} 
                isAnimationActive={true}
             />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
};
