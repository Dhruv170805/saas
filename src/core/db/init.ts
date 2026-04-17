import { query } from './postgres';
import { logger } from '../logger';

/**
 * Ensures the PostgreSQL database is reachable and the basic schema exists.
 */
export async function initializeSchema(): Promise<void> {
  try {
    // 1. Health Check
    await query('SYSTEM', 'SELECT 1');
    logger.info('🐘 PostgreSQL: Connection healthy.');

    // 2. Schema Check (Ensures migrations have run or basic tables exist)
    const tableCheck = await query<{ exists: boolean }>('SYSTEM', 
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tenants')"
    );

    if (!tableCheck[0]?.exists) {
      logger.warn('⚠️  PostgreSQL: "tenants" table not found. Ensure migrations have run.');
    } else {
      logger.info('🐘 PostgreSQL: Core schema verified.');
    }
  } catch (err: any) {
    logger.error('❌ PostgreSQL: Initialization failed', err);
    throw err;
  }
}
