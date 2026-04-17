'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard';

interface NodeTileProps {
  id: string;
  name: string;
  load: number;
  latency: string;
  status: 'Optimal' | 'Heavy Load' | 'Throttled' | 'Degraded';
}

/**
 * NodeControlTile: 2x2 grid tiles for monitoring tenant nodes.
 * Migrated to Vanilla CSS (HQ System).
 */
export const NodeControlTile: React.FC<NodeTileProps> = ({ id, name, load, latency, status }) => {
  return (
    <GlassCard className="hq-p-6" style={{ height: '8rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div className="hq-flex hq-justify-between hq-items-start">
        <div>
           <p className="hq-text-xs hq-font-black hq-text-dim hq-tracking-widest" style={{ fontFamily: 'monospace' }}>{id}</p>
           <h4 className="hq-text-sm hq-font-black hq-text-white hq-tracking-tighter hq-uppercase" style={{ marginTop: '0.125rem' }}>{name}</h4>
        </div>
        <span style={{ 
          padding: '0.125rem 0.5rem', 
          borderRadius: '0.25rem', 
          fontSize: '8px', 
          fontWeight: 900, 
          textTransform: 'uppercase', 
          letterSpacing: '0.1em',
          background: status === 'Optimal' ? 'rgba(16,185,129,0.1)' : 'rgba(255,59,59,0.1)',
          color: status === 'Optimal' ? 'var(--emerald-success)' : 'var(--alert-red)',
          border: `1px solid ${status === 'Optimal' ? 'rgba(16,185,129,0.2)' : 'rgba(255,59,59,0.2)'}`
        }}>
          {status}
        </span>
      </div>

      <div style={{ marginTop: '0.5rem' }}>
        <div className="hq-flex hq-justify-between hq-items-end" style={{ marginBottom: '0.5rem' }}>
           <div>
              <p className="hq-text-xs hq-text-dim hq-font-black hq-uppercase hq-tracking-widest" style={{ fontSize: '8px' }}>Load Matrix</p>
              <p className="hq-text-white hq-font-black" style={{ fontSize: '12px' }}>{load}%</p>
           </div>
           <div style={{ textAlign: 'right' }}>
              <p className="hq-text-xs hq-text-dim hq-font-black hq-uppercase hq-tracking-widest" style={{ fontSize: '8px' }}>Latency</p>
              <p className="hq-font-black" style={{ fontSize: '12px', fontFamily: 'monospace', color: parseInt(latency) > 100 ? 'var(--warning-orange)' : 'var(--text-dim)' }}>{latency}ms</p>
           </div>
        </div>

        {/* Load Bar */}
        <div style={{ height: '2px', width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', overflow: 'hidden' }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${load}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ 
              height: '100%', 
              background: load > 80 ? 'var(--glow-magenta)' : 'var(--glow-cyan)',
              boxShadow: `0 0 8px ${load > 80 ? '#ff00ff' : '#00f2ff'}`
            }}
          />
        </div>
      </div>
    </GlassCard>
  );
};
