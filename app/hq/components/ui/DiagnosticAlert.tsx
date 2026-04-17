import React from 'react';
import { motion } from 'framer-motion';

interface DiagnosticAlertProps {
  title: string;
  message: string;
  severity?: 'critical' | 'warning' | 'info';
  timestamp?: string;
  onAction?: () => void;
}

/**
 * DiagnosticAlert: Urgent platform notifications with dynamic cinematic styling.
 * Migrated to Vanilla CSS (HQ System).
 */
export const DiagnosticAlert: React.FC<DiagnosticAlertProps> = ({ 
  title, 
  message, 
  severity = 'warning', 
  timestamp = new Date().toLocaleTimeString(),
  onAction
}) => {
  const themes = {
    critical: {
      bg: 'rgba(255, 59, 59, 0.1)',
      border: 'rgba(255, 59, 59, 0.2)',
      glow: 'rgba(255, 59, 59, 0.05)',
      accent: 'var(--alert-red)',
      pill: 'var(--alert-red)',
      pillText: 'black',
      icon: '⚠️'
    },
    warning: {
      bg: 'rgba(249, 115, 22, 0.1)',
      border: 'rgba(249, 115, 22, 0.2)',
      glow: 'rgba(249, 115, 22, 0.05)',
      accent: 'var(--warning-orange)',
      pill: 'var(--warning-orange)',
      pillText: 'black',
      icon: '⚡'
    },
    info: {
      bg: 'rgba(0, 242, 255, 0.1)',
      border: 'rgba(0, 242, 255, 0.2)',
      glow: 'rgba(0, 242, 255, 0.05)',
      accent: 'var(--glow-cyan)',
      pill: 'var(--glow-cyan)',
      pillText: 'black',
      icon: 'ℹ️'
    }
  };

  const theme = themes[severity];

  return (
    <motion.section 
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      className="hq-diagnostic"
      style={{ 
        background: 'rgba(26, 17, 17, 0.8)', 
        border: `1px solid ${theme.border}`,
        boxShadow: 'inset 0 0 20px rgba(239, 68, 68, 0.05)',
        backdropFilter: 'blur(20px)'
      }}
    >
      <div style={{ width: '4rem', height: '4rem', background: theme.bg, borderRadius: '1.25rem', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', border: `1px solid ${theme.border}` }}>
        <span style={{ fontSize: '1.875rem' }}>{theme.icon}</span>
      </div>
      
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div className="hq-flex hq-items-center hq-gap-4" style={{ marginBottom: '0.25rem' }}>
           <h2 className="hq-text-2xl hq-font-black hq-text-white hq-uppercase hq-tracking-widest" style={{ margin: 0 }}>{title}</h2>
           <span style={{ 
              background: theme.pill, 
              color: theme.pillText, 
              fontSize: '10px', 
              fontWeight: 900, 
              padding: '0.125rem 0.5rem', 
              borderRadius: '0.25rem', 
              textTransform: 'uppercase' 
           }}>
             {severity === 'critical' ? 'Severity 1' : severity === 'warning' ? 'Warning' : 'Info'}
           </span>
        </div>
        <p className="hq-text-dim" style={{ fontSize: '14px', maxWidth: '40rem', margin: '0.25rem 0' }}>
          {message}
        </p>
        <div className="hq-flex hq-gap-6" style={{ marginTop: '1rem', fontShadow: 'monospace', fontSize: '9px', color: theme.accent, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.4em' }}>
          <span>{timestamp}</span>
          <span>Active Monitoring</span>
        </div>
      </div>

      {onAction && (
        <div className="hq-flex hq-gap-4">
           <button 
            onClick={onAction}
            className="hq-font-black hq-uppercase hq-tracking-widest"
            style={{ 
              padding: '0.75rem 2rem', 
              background: severity === 'critical' ? 'var(--alert-red)' : 'var(--glow-cyan)', 
              color: 'black', 
              borderRadius: '1rem', 
              border: 'none', 
              cursor: 'pointer',
              fontSize: '10px'
            }}
           >
             Respond
           </button>
        </div>
      )}
    </motion.section>
  );
};
