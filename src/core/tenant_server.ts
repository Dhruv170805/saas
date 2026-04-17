
import { headers, cookies } from 'next/headers';
import { verifyAccessToken } from './auth';
import { getTenantBySlug, getTenantById } from './db/tenants';
import { type DbTenant } from './db/schema';

/**
 * Server-side tenant resolution using Next.js headers() and cookies().
 * Use this in Server Components (like RootLayout).
 */
export async function getServerTenant(): Promise<DbTenant | null> {
  const headersList = await headers();
  const cookiesList = await cookies();

  // ── 1. JWT token ────────────────────────────────────────────────────────────
  const authHeader = headersList.get('Authorization');
  const cookieToken = cookiesList.get('access_token')?.value;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken;

  if (token) {
    try {
      const claims = await verifyAccessToken(token);
      if (claims.tenantId) {
        return await getTenantById(claims.tenantId);
      }
    } catch {
      // Invalid token
    }
  }

  // ── 2. X-Tenant-ID header ──────────────────────────────────────────────────
  const tenantHeader = headersList.get('X-Tenant-ID');
  if (tenantHeader) {
    const tenant = await getTenantById(tenantHeader);
    if (tenant) return tenant;
  }

  // ── 3. Subdomain from Host header ──────────────────────────────────────────
  const host = headersList.get('host') || '';
  const parts = host.split('.');
  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (subdomain && subdomain !== 'www' && subdomain !== 'admin') {
      const subdomainTenant = await getTenantBySlug(subdomain);
      if (subdomainTenant) return subdomainTenant;
    }
  }

  // ── 4. Fall back to "default" tenant ───────────────────────────────────────
  return await getTenantBySlug('default');
}
