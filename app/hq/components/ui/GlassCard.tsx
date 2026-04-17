import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hoverGlow?: boolean;
}

/**
 * GlassCard: The foundational container for the Command Center.
 * Implements high-fidelity glassmorphism using semantic Vanilla CSS.
 */
export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  style = {},
  hoverGlow = true 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hoverGlow ? { borderColor: 'rgba(0,242,255,0.3)', scale: 1.01 } : {}}
      className={`hq-glass-card ${className}`}
      style={style}
    >
      {/* Internal Glow Effect */}
      <div 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 100%)', 
          pointerEvents: 'none' 
        }} 
      />
      {children}
    </motion.div>
  );
};
