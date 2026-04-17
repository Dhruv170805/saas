import { query } from './postgres';
import { logger } from '../logger';
import { DbTenant } from './schema';

/**
 * Fetch a tenant by its unique slug.
 */
export async function getTenantBySlug(slug: string): Promise<DbTenant | null> {
  try {
    const sql = `SELECT * FROM tenants WHERE slug = $1 LIMIT 1`;
    const rows = await query<DbTenant>('SYSTEM', sql, [slug]);
    
    // Fallback if DB is reachable but empty (seeding failure) or during transition
    if (!rows.length && slug === 'default') {
      return getFailSafeTenant();
    }

    if (!rows[0]) return null;
    return mapTenant(rows[0]);
  } catch (err) {
    if (slug === 'default') {
      logger.warn('🏢 Providing Fail-Safe "default" tenant record (Postgres CONNECTION_FAILURE)');
      return getFailSafeTenant();
    }
    logger.error(`Error fetching tenant by slug: ${slug}`, err);
    return null;
  }
}

/**
 * Fetch a tenant by its UUID.
 */
export async function getTenantById(id: string): Promise<DbTenant | null> {
  try {
    const sql = `SELECT * FROM tenants WHERE id = $1 LIMIT 1`;
    const rows = await query<DbTenant>('SYSTEM', sql, [id]);
    
    if (!rows.length && (id === 'default' || id === '00000000-0000-0000-0000-000000000000')) {
      return getFailSafeTenant();
    }

    if (!rows[0]) return null;
    return mapTenant(rows[0]);
  } catch (err) {
    if (id === 'default' || id === '00000000-0000-0000-0000-000000000000') {
      logger.warn('🏢 Providing Fail-Safe "default" tenant record by ID (Postgres CONNECTION_FAILURE)');
      return getFailSafeTenant();
    }
    logger.error(`Error fetching tenant by id: ${id}`, err);
    return null;
  }
}

/**
 * List all tenants (privileged - bypasses RLS)
 */
export async function listTenants(): Promise<DbTenant[]> {
  const sql = `SELECT * FROM tenants ORDER BY created_at DESC`;
  const rows = await query<DbTenant>('SYSTEM', sql);
  return rows.map(mapTenant);
}

/**
 * Update tenant metadata (privileged)
 */
export async function updateTenant(id: string, updates: Partial<DbTenant>): Promise<DbTenant | null> {
  const keys = Object.keys(updates).filter(k => k !== 'id' && k !== 'createdAt' && k !== 'updatedAt');
  if (keys.length === 0) return null;

  const setClause = keys.map((key, i) => {
      // Map camelCase to snake_case if necessary, but here we assume the DB columns match or we handle mapping
      const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      return `${dbKey} = $${i + 2}`;
  }).join(', ');
  
  const values = keys.map(k => (updates as any)[k]);

  const sql = `UPDATE tenants SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`;
  const rows = await query<DbTenant>('SYSTEM', sql, [id, ...values]);
  return rows[0] ? mapTenant(rows[0]) : null;
}

/**
 * Suspend a tenant, preventing access.
 */
export async function suspendTenant(id: string): Promise<void> {
  const sql = `UPDATE tenants SET suspended = true, updated_at = NOW() WHERE id = $1`;
  await query('SYSTEM', sql, [id]);
}

/**
 * Reactivate a suspended tenant.
 */
export async function reactivateTenant(id: string): Promise<void> {
  const sql = `UPDATE tenants SET suspended = false, updated_at = NOW() WHERE id = $1`;
  await query('SYSTEM', sql, [id]);
}

/**
 * Invalidate tenant cache (placeholder).
 */
export async function invalidateTenantCache(slug: string): Promise<void> {
  logger.info(`Invalidating cache for tenant: ${slug}`);
}

/**
 * 🛡️ Relentless Resilience: Fallback data for critical system bootstrapping.
 */
function getFailSafeTenant(): DbTenant {
  return {
    id: '00000000-0000-0000-0000-000000000000',
    slug: 'default',
    name: 'NEXUS (Fail-Safe Mode)',
    logoUrl: null,
    plan: 'pro',
    theme: { primary: '#0ea5e9', accent: '#ffffff', muted: '#1e293b', font: 'Inter' },
    config: { 
        currencySymbol: '₹', 
        taxEnabled: true, 
        taxRate: 5,
        taxLabel: 'GST',
        currencyCode: 'INR',
        currencyLocale: 'en-IN',
        maxTables: 20,
        maxMenuItems: 100,
        timezone: 'Asia/Kolkata'
    },
    suspended: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export interface PgSuperAdmin {
    id: string;
    email: string;
    role: string;
    totp_secret?: string;
}

/**
 * Maps snake_case DB columns to camelCase interface properties.
 */
function mapTenant(row: any): DbTenant {
    return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        logoUrl: row.logo_url,
        plan: row.plan,
        planExpiresAt: row.plan_expires_at,
        theme: row.theme,
        config: row.config,
        suspended: row.suspended,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}
