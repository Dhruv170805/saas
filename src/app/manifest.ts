import { MetadataRoute } from 'next'
import { getTenantBySlug } from '@/core/db/tenants'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
    // Graceful fallback during build-time if Database is unreachable
    let defaultData = { name: 'NEXUS COMMAND', theme: '#0ea5e9' }
    try {
        // Attempt to fetch platform branding, but fall back gracefully to Control Plane defaults
        const tenant = await getTenantBySlug('default').catch(() => null);
        if (tenant && tenant.theme) {
            defaultData.name = tenant.name || defaultData.name;
            defaultData.theme = tenant.theme.primary || defaultData.theme;
        }
    } catch (e) {
        console.warn('⚠️ Manifest_Hydration_Failure: Defaulting to NEXUS_COMMAND branding.');
    }

    return {
        name: defaultData.name,
        short_name: defaultData.name,
        description: 'Multi-Tenant Restaurant POS System',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: defaultData.theme,
        icons: [
            {
                src: '/logo.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
    }
}
