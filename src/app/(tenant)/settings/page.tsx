'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useTenant, useTenantMutations } from '@/hooks/useData'
import { TenantResponse } from '@/services/api'

export default function SettingsPage() {
  const { tenant: initialTenant, isError, mutate } = useTenant()
  const { updateTenant, uploadLogo } = useTenantMutations()
  
  const [tenant, setTenant] = useState<TenantResponse | null>(null)

  // Sync state once data loads
  useEffect(() => {
    if (initialTenant && !tenant) {
      // Create a deep copy to edit locally
      setTenant(JSON.parse(JSON.stringify(initialTenant)))
    }
  }, [initialTenant, tenant])

  const handleSave = async () => {
    if (!tenant || updateTenant.isPending) return

    try {
      const payload = {
        name: tenant.name,
        theme: tenant.theme,
        config: {
          ...tenant.config,
          taxRate: tenant.config.taxRate, // ensure number
          maxTables: tenant.config.maxTables,
        }
      }

      const res = await updateTenant.mutateAsync(payload)

      if (!res.error) {
        toast.success('Tenant Settings saved successfully!')
        mutate() // Trigger refetch
        // Force a hard reload if brand colors changed to cascade changes
        if (tenant.theme.primary !== initialTenant?.theme.primary) {
          window.location.reload()
        }
      } else {
        toast.error(res.error || 'Failed to save settings')
      }
    } catch (err) {
      console.error('Failed to save settings', err)
      toast.error('Failed to save settings')
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || uploadLogo.isPending) return
    const file = e.target.files[0]
    
    try {
      const res = await uploadLogo.mutateAsync(file)

      if (!res.error && res.data) {
        const { logoUrl, primaryColor } = res.data

        setTenant((prev) => prev ? { 
          ...prev, 
          logoUrl, 
          theme: { ...prev.theme, primary: primaryColor } 
        } : prev)
        
        mutate() // Trigger refetch
        toast.success('Logo uploaded & Theme Extracted!')
      } else {
        toast.error(res.error || 'Failed to upload logo')
      }
    } catch (err) {
      toast.error('Network error uploading logo')
    }
  }

  const updateConfig = (field: keyof TenantResponse['config'], value: any) => {
    setTenant((prev) => prev ? { ...prev, config: { ...prev.config, [field]: value } } : prev)
  }
  const updateTheme = (field: keyof TenantResponse['theme'], value: any) => {
    setTenant((prev) => prev ? { ...prev, theme: { ...prev.theme, [field]: value } } : prev)
  }

  if (isError) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--foreground-subtle)' }}>
        <p style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</p>
        <p>Failed to load tenant configuration</p>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--foreground-subtle)' }}>
        <p style={{ fontSize: '1.1rem' }}>Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1>⚙️ Tenant Settings</h1>
          <p
            style={{ color: 'var(--foreground-muted)', marginTop: '0.25rem', fontSize: '0.95rem' }}
          >
            Configure your restaurant branding, currency, and tax
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={updateTenant.isPending}>
          {updateTenant.isPending ? 'Saving...' : '💾 Save Settings'}
        </button>
      </div>

      {/* Brand Details */}
      <div className="card">
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: 700 }}>
          🏪 Brand & Visuals
        </h3>
        
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-6">
            <div style={{ 
              width: 80, height: 80, borderRadius: 12, overflow: 'hidden', 
              border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {tenant.logoUrl ? (
                 <img src={tenant.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: 24 }}>🏢</span>
              )}
            </div>
            <div>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Business Logo</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)', marginBottom: '0.75rem' }}>Max size 2MB. We support PNG, JPEG, SVG.</p>
              <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-block' }}>
                {uploadLogo.isPending ? 'Uploading...' : 'Upload Logo'}
                <input type="file" accept="image/png, image/jpeg, image/webp, image/svg+xml" style={{ display: 'none' }} onChange={handleLogoUpload} disabled={uploadLogo.isPending} />
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Restaurant Name</label>
            <input
              type="text"
              className="form-input"
              value={tenant.name}
              onChange={(e) => setTenant((prev) => prev ? { ...prev, name: e.target.value } : prev)}
              placeholder="e.g. Acme Dining"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
             <div className="form-group">
                <label className="form-label">Primary Brand Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={tenant.theme.primary}
                    onChange={(e) => updateTheme('primary', e.target.value)}
                    style={{ width: '40px', height: '40px', padding: 0, border: 'none', background: 'transparent' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={tenant.theme.primary}
                    onChange={(e) => updateTheme('primary', e.target.value)}
                  />
                </div>
              </div>
          </div>
        </div>
      </div>

      {/* Currency */}
      <div className="card">
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: 700 }}>
          💰 Currency Preferences
        </h3>
        <div className="flex flex-col gap-4">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Symbol</label>
              <input
                type="text"
                className="form-input"
                value={tenant.config.currencySymbol}
                onChange={(e) => updateConfig('currencySymbol', e.target.value)}
                placeholder="₹"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Code</label>
              <input
                type="text"
                className="form-input"
                value={tenant.config.currencyCode}
                onChange={(e) => updateConfig('currencyCode', e.target.value)}
                placeholder="INR"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Locale Format</label>
              <input
                type="text"
                className="form-input"
                value={tenant.config.currencyLocale}
                onChange={(e) => updateConfig('currencyLocale', e.target.value)}
                placeholder="en-IN"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tax */}
      <div className="card">
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: 700 }}>📊 Tax Config</h3>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <label
              style={{
                position: 'relative',
                display: 'inline-block',
                width: '48px',
                height: '26px',
              }}
            >
              <input
                type="checkbox"
                checked={tenant.config.taxEnabled}
                onChange={(e) => updateConfig('taxEnabled', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  inset: 0,
                  background: tenant.config.taxEnabled ? 'var(--primary, #f37c22)' : 'rgba(255,255,255,0.1)',
                  borderRadius: '26px',
                  transition: 'all 0.3s',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    content: '""',
                    width: '20px',
                    height: '20px',
                    left: tenant.config.taxEnabled ? '24px' : '3px',
                    bottom: '3px',
                    background: '#fff',
                    borderRadius: '50%',
                    transition: 'all 0.3s',
                  }}
                />
              </span>
            </label>
            <span style={{ fontSize: '0.9rem', color: 'var(--foreground-muted)' }}>
              Automatically apply tax to orders
            </span>
          </div>
          {tenant.config.taxEnabled && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Tax Label</label>
                <input
                  type="text"
                  className="form-input"
                  value={tenant.config.taxLabel}
                  onChange={(e) => updateConfig('taxLabel', e.target.value)}
                  placeholder="GST"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tax Rate (%)</label>
                <input
                  type="number"
                  className="form-input"
                  value={tenant.config.taxRate * 100}
                  onChange={(e) => updateConfig('taxRate', parseFloat(e.target.value) / 100 || 0)}
                  placeholder="5"
                  min="0"
                  max="100"
                  step="0.5"
                />
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
