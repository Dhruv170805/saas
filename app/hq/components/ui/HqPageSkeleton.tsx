import React from 'react';
import { GlassCard } from './GlassCard';

/**
 * HqPageSkeleton: High-fidelity loading states for the Command Center.
 */
export const HqPageSkeleton: React.FC = () => {
  return (
    <div className="p-10 space-y-10 max-w-[1800px] mx-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="h-10 w-64 bg-white/5 rounded-xl mb-12" />

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {[1, 2, 3, 4].map((i) => (
          <GlassCard key={i} className="h-48" hoverGlow={false}>
            <div className="p-8 space-y-4">
              <div className="h-3 w-20 bg-white/5 rounded" />
              <div className="h-10 w-32 bg-white/10 rounded-lg" />
              <div className="h-8 w-full bg-white/5 rounded mt-6" />
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Body Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <div className="xl:col-span-8">
          <GlassCard className="h-[600px]" hoverGlow={false} />
        </div>
        <div className="xl:col-span-4">
          <GlassCard className="h-[600px]" hoverGlow={false} />
        </div>
      </div>
    </div>
  );
};
