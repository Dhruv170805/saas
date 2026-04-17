'use client';

import React from 'react';
import { Search, BarChart3, Bell, User, LayoutGrid, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHqAnalytics } from '../../hooks/use-hq-data';

/**
 * HqGlobalHeader: Top-bar identity and search plane.
 * Includes a subtle "SIMULATION ACTIVE" indicator for demo transparency.
 */
export const HqGlobalHeader: React.FC = () => {
  const { isSimulation } = useHqAnalytics();

  return (
    <header className="hq-flex hq-items-center hq-justify-between hq-px-10" style={{ height: '5rem', borderBottom: '1px solid rgba(255,255,255,0.03)', background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 50 }}>
      <div className="hq-flex hq-items-center hq-gap-8" style={{ flex: 1 }}>
        <div className="hq-flex hq-items-center hq-gap-2">
           <div className="hq-flex hq-items-center hq-justify-center" style={{ width: '2rem', height: '2rem', background: 'rgba(0,242,255,0.1)', borderRadius: '0.5rem', border: '1px solid rgba(0,242,255,0.2)' }}>
              <div style={{ width: '1rem', height: '1rem', background: 'var(--glow-cyan)', borderRadius: '0.25rem', boxShadow: '0 0 8px rgba(0,242,255,0.6)' }} />
           </div>
           <span className="hq-font-black hq-text-white hq-uppercase" style={{ fontSize: '1.25rem', letterSpacing: '0.2em' }}>Nexus</span>
        </div>

        {isSimulation && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="hq-flex hq-items-center hq-gap-2" 
            style={{ 
              background: 'rgba(139, 92, 246, 0.1)', 
              border: '1px solid rgba(139, 92, 246, 0.2)', 
              padding: '0.375rem 1rem', 
              borderRadius: '100px' 
            }}
          >
            <Zap size={10} className="hq-text-magenta animate-pulse" />
            <span className="hq-text-magenta hq-font-black hq-uppercase hq-tracking-widest" style={{ fontSize: '8px' }}>Simulation Active</span>
          </motion.div>
        )}

        <div className="hq-flex hq-items-center" style={{ maxWidth: '32rem', width: '100%', position: 'relative' }}>
          <Search size={16} className="hq-text-dim" style={{ position: 'absolute', left: '1.5rem' }} />
          <input 
            type="text" 
            placeholder="Search operations, tenants, logs..."
            className="hq-font-black hq-text-white"
            style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '1rem', padding: '0.75rem 1.5rem 0.75rem 3.5rem', fontSize: '13px', outline: 'none' }}
          />
        </div>
      </div>

      <div className="hq-flex hq-items-center hq-gap-6">
        <div className="hq-flex hq-items-center hq-gap-2 hq-p-4 hq-glass-card" style={{ padding: '0.375rem', borderRadius: '1rem', height: 'auto' }}>
           <HeaderIconButton icon={<BarChart3 size={18} />} />
           <HeaderIconButton icon={<Bell size={18} />} />
           <HeaderIconButton icon={<LayoutGrid size={18} />} />
        </div>

        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="hq-flex hq-items-center hq-gap-4" 
          style={{ paddingLeft: '1.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
        >
          <div style={{ textAlign: 'right' }}>
            <p className="hq-text-xs hq-font-black hq-text-white hq-uppercase hq-tracking-widest">Dhruv Patel</p>
            <p className="hq-text-cyan hq-font-black hq-uppercase" style={{ fontSize: '8px', opacity: 0.6, letterSpacing: '0.2em' }}>Level 4 Clearance</p>
          </div>
          <div className="hq-flex hq-items-center hq-justify-center" style={{ width: '2.5rem', height: '2.5rem', background: '#1a1a1a', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)' }}>
             <User size={20} className="hq-text-dim" style={{ opacity: 0.4 }} />
          </div>
        </motion.div>
      </div>
    </header>
  );
};

const HeaderIconButton = ({ icon }: { icon: React.ReactNode }) => (
  <button className="hq-flex hq-items-center hq-justify-center hq-text-dim" style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', cursor: 'pointer', background: 'transparent', border: 'none', transition: 'all 0.3s ease' }}>
    {icon}
  </button>
);
