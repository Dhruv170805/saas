
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://nexus_admin:nexus_secret_change_me@localhost:5432/restaurant_saas',
});

async function setup() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('🏗️ Creating user_tenants table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_tenants (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        roles VARCHAR(32)[] DEFAULT '{cashier}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (user_id, tenant_id)
      );
    `);

    console.log('🏗️ Seeding Permissions...');
    const permissions = [
      ['manage_menu', 'Can create, edit and delete menu items'],
      ['manage_orders', 'Can process and cancel orders'],
      ['view_analytics', 'Can view revenue and growth metrics'],
      ['manage_staff', 'Can invite and manage tenant users'],
      ['manage_billing', 'Can manage subscriptions and payments'],
      ['system_admin', 'Full platform control (SuperAdmin only)']
    ];

    for (const [id, desc] of permissions) {
      await client.query(`
        INSERT INTO permissions (id, description) 
        VALUES ($1, $2) 
        ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description
      `, [id, desc]);
    }

    console.log('🏗️ Seeding Role Permissions...');
    const roleMappings = {
      'admin': ['manage_menu', 'manage_orders', 'view_analytics', 'manage_staff', 'manage_billing'],
      'cashier': ['manage_orders'],
      'superadmin': ['manage_menu', 'manage_orders', 'view_analytics', 'manage_staff', 'manage_billing', 'system_admin']
    };

    for (const [role, perms] of Object.entries(roleMappings)) {
      for (const perm of perms) {
        await client.query(`
          INSERT INTO role_permissions (role, permission_id) 
          VALUES ($1, $2) 
          ON CONFLICT DO NOTHING
        `, [role, perm]);
      }
    }

    await client.query('COMMIT');
    console.log('✅ Enterprise Auth Setup Complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Setup Failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

setup();
