'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useHqTenants } from '@/hooks/useData';
import { hqService } from '@/services/api';
import { HqPageSkeleton } from '@/features/hq/components/ui/HqPageSkeleton';
import { ResourceTable } from '@/features/hq/components/ui/ResourceTable';
import { DiagnosticAlert } from '@/features/hq/components/ui/DiagnosticAlert';

/**
 * NEXUS COMMAND: Fleet Registry.
 * Migrated to Vanilla CSS (HQ System).
 */
export default function TenantsGovernance() {
  const { tenants, isLoading, isError, mutate } = useHqTenants();

  async function toggleStatus(tenantId: string, isSuspended: boolean) {
    const action = isSuspended ? 'activate' : 'suspend';
    const res = await hqService.toggleTenantStatus(tenantId, action);
    if (!res.error) {
      mutate();
    }
  }

  if (isLoading) return <HqPageSkeleton />;

  if (isError) return (
    <div className="hq-py-10">
      <DiagnosticAlert 
        severity="critical"
        title="Fleet Synchronization Failure"
        message="Unable to retrieve the multitenant registry from the Primary Controller. Security protocols may be inhibiting communications."
      />
    </div>
  );

  const columns = [
    {
      header: 'Identity',
      render: (tenant: any) => (
        <div className="hq-flex hq-items-center hq-justify-center" style={{ width: '3rem', height: '3rem', background: '#1a1a1a', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)', fontSize: '14px', fontWeight: 900, color: 'var(--glow-cyan)' }}>
          {tenant.name[0].toUpperCase()}
        </div>
      )
    },
    {
      header: 'Name & Cluster',
      render: (tenant: any) => (
        <div>
          <p className="hq-text-lg hq-font-black hq-text-white hq-tracking-tighter" style={{ marginBottom: '4px' }}>{tenant.name}</p>
          <p className="hq-text-xs hq-text-dim hq-font-black hq-uppercase hq-tracking-widest">{tenant.slug}.nexus_fleet.node</p>
        </div>
      )
    },
    {
      header: 'Assigned Plan',
      render: (tenant: any) => (
        <span style={{ 
          padding: '0.375rem 1rem', 
          borderRadius: '100px', 
          fontSize: '9px', 
          fontWeight: 900, 
          textTransform: 'uppercase', 
          letterSpacing: '0.1em',
          background: 'rgba(139, 92, 246, 0.1)',
          color: 'var(--purple-mrr)',
          border: '1px solid rgba(139, 92, 246, 0.2)'
        }}>
          {tenant.plan}
        </span>
      )
    },
    {
      header: 'Resilience Status',
      render: (tenant: any) => (
        <div className="hq-flex hq-items-center hq-gap-2">
          <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: tenant.suspended ? 'var(--alert-red)' : 'var(--emerald-success)', boxShadow: `0 0 8px ${tenant.suspended ? 'var(--alert-red)' : 'var(--emerald-success)'}` }} />
          <span className="hq-text-xs hq-font-black hq-text-white hq-uppercase hq-tracking-widest">
            {tenant.suspended ? 'DEGRADED / SUSPENDED' : 'OPERATIONAL'}
          </span>
        </div>
      )
    },
    {
      header: 'Directive',
      render: (tenant: any) => (
        <button 
          onClick={() => toggleStatus(tenant.id, tenant.suspended)}
          style={{ 
            padding: '0.5rem 1.5rem', 
            borderRadius: '0.75rem', 
            fontSize: '9px', 
            fontWeight: 900, 
            textTransform: 'uppercase', 
            letterSpacing: '0.1em',
            background: tenant.suspended ? 'var(--emerald-success)' : 'rgba(255, 59, 59, 0.1)',
            color: tenant.suspended ? 'black' : 'var(--alert-red)',
            border: tenant.suspended ? 'none' : '1px solid rgba(255, 59, 59, 0.2)',
            cursor: 'pointer'
          }}
        >
          {tenant.suspended ? 'Re-Activate' : 'Suspend Node'}
        </button>
      )
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="hq-flex-col hq-gap-10"
    >
      <section>
        <h2 className="hq-text-xs hq-font-black hq-text-cyan hq-uppercase hq-tracking-widest" style={{ marginBottom: '0.5rem' }}>Strategic Asset Control</h2>
        <h1 className="hq-text-4xl hq-font-black hq-text-white hq-tracking-tighter">Fleet Entities</h1>
      </section>

      <ResourceTable 
        data={tenants}
        columns={columns}
      />
    </motion.div>
  );
}
