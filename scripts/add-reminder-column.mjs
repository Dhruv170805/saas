import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || 'postgresql://nexus_admin:nexus_secret_change_me@localhost:5432/restaurant_saas',
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🚀 Migrating: Adding reminder_sent_at to orders...');
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE;
    `);
    console.log('✅ Migration successful');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
