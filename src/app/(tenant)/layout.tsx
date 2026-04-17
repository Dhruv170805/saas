import React from 'react'
import Link from 'next/link'
import { headers } from 'next/headers'
import { getTenantBySlug } from '@/core/db/tenants'

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const tenantSlug = headersList.get('X-Tenant-ID') || 'default'
  const tenant = await getTenantBySlug(tenantSlug)

  const restaurantName = tenant?.name || 'NEXUS POS'
  const brandLogo = tenant?.logoUrl || '/logo.png'
  
  // High-Intelligence Branding: Dynamic CSS Variables
  const theme = tenant?.theme || { primary: '#f37c22', accent: '#fbbf24', muted: '#1e293b' }
  const primary = theme.primary
  const accent = theme.accent
  const muted = theme.muted

  return (
    <div className="tenant-plane">
      <style dangerouslySetInnerHTML={{
        __html: `
          :root {
            --primary: ${primary};
            --primary-light: ${primary}cc;
            --primary-dark: ${primary};
            --accent: ${accent};
            --muted: ${muted};
            --brand-glow: ${primary}44;
          }
        `
      }} />
      
      <nav className="hq-nav-surface">
        <Link
          href="/"
          style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', padding: '0.2rem 0.5rem', borderRadius: '12px', transition: 'all 0.2s', background: 'rgba(255,255,255,0.03)' }}
          className="hover:scale-105"
        >
          {tenant?.logoUrl && (
            <img src={tenant.logoUrl} alt="Logo" style={{ height: '36px', width: '36px', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }} />
          )}
          <span
            style={{
              fontSize: '1.45rem',
              fontWeight: 900,
              background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px',
              userSelect: 'none',
            }}
          >
            {restaurantName}
          </span>
        </Link>
        <div className="flex gap-6 items-center">
          <Link href="/" className="nav-link">Tables</Link>
          <Link href="/tables/qr" className="nav-link">QR</Link>
          <Link href="/menu" className="nav-link">Menu</Link>
          <Link href="/orders" className="nav-link">Orders</Link>
          <Link href="/dashboard" className="nav-link">Sales</Link>
          <Link href="/messages" className="nav-link">Marketing</Link>
          <Link href="/settings" className="nav-link" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '0.4rem 0.8rem' }}>Settings</Link>
        </div>
      </nav>

      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          opacity: 0.12,
          filter: 'blur(50px)',
          transform: 'scale(2)',
        }}
      >
        <img src={brandLogo} alt="" style={{ width: '60vmin', height: '60vmin', objectFit: 'contain', filter: 'saturate(2)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, paddingTop: '4.8rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <main className="container animate-fade-in" style={{ flex: 1, width: '100%' }}>{children}</main>
        <footer style={{ textAlign: 'center', padding: '1.5rem', opacity: 0.6, fontSize: '0.875rem' }}>
          Made By Dhruv Patel
        </footer>
      </div>
    </div>
  )
}
