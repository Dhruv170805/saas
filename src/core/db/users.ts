import { query, transaction } from './postgres';
import { logger } from '../logger';
import { DbUser } from './schema';
import { randomUUID } from 'crypto';

/**
 * Fetch a user by email within a specific tenant context.
 */
export async function getUserByEmail(tenantId: string, email: string): Promise<DbUser | null> {
  const sql = `
    SELECT u.*, ut.roles 
    FROM users u
    JOIN user_tenants ut ON u.id = ut.user_id
    WHERE u.email = $1 AND ut.tenant_id = $2
    LIMIT 1
  `;
  // We use SYSTEM context to find the user/tenant link during login
  const rows = await query<any>('SYSTEM', sql, [email, tenantId]);
  if (!rows[0]) return null;
  return mapUser(rows[0], tenantId);
}

/**
 * Fetch a user by ID.
 */
export async function getUserById(tenantId: string, id: string): Promise<DbUser | null> {
  const sql = `
    SELECT u.*, ut.roles 
    FROM users u
    JOIN user_tenants ut ON u.id = ut.user_id
    WHERE u.id = $1 AND ut.tenant_id = $2
    LIMIT 1
  `;
  const rows = await query<any>('SYSTEM', sql, [id, tenantId]);
  if (!rows[0]) return null;
  return mapUser(rows[0], tenantId);
}

/**
 * Create a new user and link them to a tenant.
 */
export async function createUser(tenantId: string, user: Partial<DbUser>): Promise<DbUser> {
    return await transaction('SYSTEM', async (client) => {
        const id = user.id || randomUUID();
        
        // 1. Create or Update Global User
        const userSql = `
            INSERT INTO users (id, email, password_hash, name, totp_secret, totp_enabled, email_verified)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
            RETURNING *
        `;
        const userRes = await client.query(userSql, [
            id,
            user.email,
            user.passwordHash,
            user.name,
            user.totpSecret || null,
            user.totpEnabled || false,
            user.emailVerified || false
        ]);
        const dbUser = userRes.rows[0];

        // 2. Link to Tenant
        const linkSql = `
            INSERT INTO user_tenants (user_id, tenant_id, roles)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, tenant_id) DO UPDATE SET roles = EXCLUDED.roles
            RETURNING roles
        `;
        const linkRes = await client.query(linkSql, [
            dbUser.id,
            tenantId,
            user.roles || ['cashier']
        ]);

        return mapUser({ ...dbUser, roles: linkRes.rows[0].roles }, tenantId);
    });
}

/**
 * Atomic creation of a new tenant and its initial admin user.
 */
export async function provisionTenantAdmin(data: {
  slug: string;
  restaurantName: string;
  ownerName: string;
  email: string;
  passwordHash: string;
}): Promise<{ tenantId: string; userId: string }> {
  return await transaction('SYSTEM', async (client) => {
    // 1. Create Tenant
    const tenantId = randomUUID();
    const tenantSql = `
      INSERT INTO tenants (id, slug, name)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    const tenantRes = await client.query(tenantSql, [tenantId, data.slug, data.restaurantName]);
    const actualTenantId = tenantRes.rows[0].id;

    // 2. Create User
    const userId = randomUUID();
    const userSql = `
      INSERT INTO users (id, email, password_hash, name, email_verified)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE SET email_verified = true
      RETURNING id
    `;
    const userRes = await client.query(userSql, [
      userId,
      data.email,
      data.passwordHash,
      data.ownerName,
      true
    ]);
    const actualUserId = userRes.rows[0].id;

    // 3. Link User to Tenant
    await client.query(`
      INSERT INTO user_tenants (user_id, tenant_id, roles)
      VALUES ($1, $2, $3)
    `, [actualUserId, actualTenantId, ['admin']]);

    return { 
      tenantId: actualTenantId, 
      userId: actualUserId 
    };
  });
}

/**
 * Update user details.
 */
export async function updateUser(tenantId: string, userId: string, updates: Partial<DbUser>): Promise<DbUser | null> {
    return await transaction('SYSTEM', async (client) => {
        // Update global user details if provided
        const userFields = [];
        const userValues = [];
        if (updates.name) { userFields.push('name'); userValues.push(updates.name); }
        if (updates.email) { userFields.push('email'); userValues.push(updates.email); }
        
        if (userFields.length > 0) {
            const setClause = userFields.map((f, i) => `${f} = $${i + 2}`).join(', ');
            await client.query(`UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1`, [userId, ...userValues]);
        }

        // Update tenant-specific roles if provided
        if (updates.roles) {
            await client.query(`UPDATE user_tenants SET roles = $3 WHERE user_id = $1 AND tenant_id = $2`, [userId, tenantId, updates.roles]);
        }

        return await getUserById(tenantId, userId);
    });
}

/**
 * Fetch all permissions for a user based on their roles.
 */
export async function getUserPermissions(roles: string[]): Promise<string[]> {
  if (!roles || roles.length === 0) return [];
  
  const sql = `
    SELECT DISTINCT permission_id 
    FROM role_permissions 
    WHERE role = ANY($1)
  `;
  const rows = await query<any>('SYSTEM', sql, [roles]);
  return rows.map(r => r.permission_id);
}

/**
 * Persist or rotate a refresh token for a user.
 */
export async function updateUserRefreshToken(userId: string, data: { hash: string; deviceId: string; expiresAt: string }) {
  const sql = `
    INSERT INTO refresh_tokens (user_id, token_hash, device_id, expires_at)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id, device_id) DO UPDATE SET token_hash = EXCLUDED.token_hash, expires_at = EXCLUDED.expires_at
  `;
  // We use SYSTEM context because during login we haven't set current_user_id yet
  return await query('SYSTEM', sql, [userId, data.hash, data.deviceId, data.expiresAt]);
}

/**
 * Verify if a refresh token exists and is valid for a user.
 */
export async function verifyUserRefreshToken(userId: string, tokenHash: string): Promise<boolean> {
  const sql = `
    SELECT 1 FROM refresh_tokens 
    WHERE user_id = $1 AND token_hash = $2 AND expires_at > NOW() 
    LIMIT 1
  `;
  const rows = await query('SYSTEM', sql, [userId, tokenHash]);
  return rows.length > 0;
}

/**
 * Revoke a specific refresh token.
 */
export async function revokeUserRefreshToken(userId: string, tokenHash: string): Promise<void> {
  const sql = `DELETE FROM refresh_tokens WHERE user_id = $1 AND token_hash = $2`;
  await query('SYSTEM', sql, [userId, tokenHash]);
}

/**
 * Helper to map DB row to DbUser interface.
 */
function mapUser(row: any, tenantId: string): DbUser {
    return {
        id: row.id,
        tenantId: tenantId,
        email: row.email,
        passwordHash: row.password_hash,
        name: row.name,
        roles: row.roles,
        totpSecret: row.totp_secret,
        totpEnabled: row.totp_enabled,
        emailVerified: row.email_verified,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}
