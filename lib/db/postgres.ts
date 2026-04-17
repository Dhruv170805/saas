import { Pool, PoolClient } from 'pg';
import { logger } from '../logger';

// ── SaaS PostgreSQL Connection Pool ───
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://nexus_admin:nexus_secret_change_me@localhost:5432/restaurant_saas',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err: Error) => {
  logger.error('Unexpected error on idle PostgreSQL client', err);
});

export async function query<T>(
  tenantId: string,
  text: string,
  params?: any[]
): Promise<T[]> {
  try {
    const client = await pool.connect();
    try {
      // 🛡️ Enforce Isolation at the DB Layer
      await client.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
      
      const res = await client.query(text, params);
      return res.rows as T[];
    } finally {
      client.release();
    }
  } catch (err: any) {
    // 🛡️ God-Level Integrity: Hard fail on infrastructure errors
    logger.error(`🐘 PostgreSQL CONNECTION_FAILURE (${err.code || err.severity}): ${err.message}`);
    throw err;
  }
}

/**
 * Transaction wrapper with tenant isolation.
 */
export async function transaction<T>(
  tenantId: string,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
    
    try {
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    }
  } finally {
    client.release();
  }
}

export default pool;
