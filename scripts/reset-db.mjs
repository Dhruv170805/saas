
import pg from 'pg';
import fs from 'fs';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://nexus_admin:nexus_secret_change_me@localhost:5432/restaurant_saas',
});

async function reset() {
  const client = await pool.connect();
  try {
    console.log('🔥 Dropping existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS role_permissions CASCADE;
      DROP TABLE IF EXISTS permissions CASCADE;
      DROP TABLE IF EXISTS payment_requests CASCADE;
      DROP TABLE IF EXISTS subscriptions CASCADE;
      DROP TABLE IF EXISTS plans CASCADE;
      DROP TABLE IF EXISTS refresh_tokens CASCADE;
      DROP TABLE IF EXISTS audit_logs CASCADE;
      DROP TABLE IF EXISTS customers CASCADE;
      DROP TABLE IF EXISTS order_items CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS menu_items CASCADE;
      DROP TABLE IF EXISTS categories CASCADE;
      DROP TABLE IF EXISTS user_tenants CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS tenants CASCADE;
      DROP TABLE IF EXISTS super_admins CASCADE;
      DROP TABLE IF EXISTS platform_audit_logs CASCADE;
    `);

    console.log('🏗️ Applying Unified Schema...');
    const schema = fs.readFileSync('infra/db/unified_schema.sql', 'utf8');
    await client.query(schema);

    console.log('🌱 Seeding Platform Data...');
    // Seed default tenant
    const tenantId = '00000000-0000-0000-0000-000000000000';
    await client.query('INSERT INTO tenants (id, slug, name, plan) VALUES ($1, \'default\', \'NEXUS Main Cluster\', \'pro\')', [tenantId]);

    // Seed platform owner
    // Password: GOD_MODE_ACTIVE_2026
    const userId = 'f0000000-0000-0000-0000-000000000000';
    await client.query('INSERT INTO users (id, email, password_hash, name, email_verified) VALUES ($1, \'superadmin@nexus.com\', \'$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgNI9A9bcP.J8L8hH0k8fWIDT9uW\', \'Admin Controller\', true)', [userId]);

    await client.query('INSERT INTO user_tenants (user_id, tenant_id, roles) VALUES ($1, $2, \'{superadmin}\')', [userId, tenantId]);

    console.log('✅ DB Reset and Unified Setup Complete.');
  } catch (err) {
    console.error('❌ Reset Failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

reset();
