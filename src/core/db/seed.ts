import { query, transaction } from './postgres';
import bcrypt from 'bcryptjs';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000000';

/**
 * PostgreSQL Seeder: Provisions baseline data for the NEXUS Platform.
 * Focuses on purely relational data for the Control and Delivery planes.
 */
async function seed() {
  console.log('🐘 PostgreSQL Seeder: Initializing Platform Baseline...');

  try {
    // 1. Seed Default Tenant
    await query('SYSTEM', `
      INSERT INTO tenants (id, slug, name, config) 
      VALUES ($1, 'default', 'NEXUS Standard Tenant', '{}') 
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    `, [DEFAULT_TENANT_ID]);
    console.log('✅ Tenant: "default" synchronized.');

    // 2. Seed SuperAdmin User
    // Roles are stored as an array of strings in PostgreSQL
    const hashedPass = await bcrypt.hash('GOD_MODE_ACTIVE_2026', 12);
    await query('SYSTEM', `
      INSERT INTO users (id, email, password_hash, name, roles, tenant_id)
      VALUES ('f0000000-0000-0000-0000-000000000000', 'superadmin@nexus.com', $1, 'Platform Owner', '{superadmin}', $2)
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, roles = '{superadmin}'
    `, [hashedPass, DEFAULT_TENANT_ID]);
    console.log('✅ User: superadmin synchronized.');

    // 3. Seed Menu from menu.json
    await seedMenuFromJson();

    // 4. Seed RBAC
    console.log('🔐 Seeding RBAC permissions...');
    const permissions = [
      { id: 'can_manage_menu', description: 'Can add/edit/delete categories and items' },
      { id: 'can_manage_orders', description: 'Can create and update orders' },
      { id: 'can_view_analytics', description: 'Can see revenue and performance stats' },
      { id: 'can_manage_staff', description: 'Can manage user accounts for the tenant' },
      { id: 'can_manage_settings', description: 'Can change restaurant configuration and theme' },
    ];

    for (const p of permissions) {
      await query('SYSTEM', 'INSERT INTO permissions (id, description) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description', [p.id, p.description]);
    }

    const roleMappings = [
      { role: 'admin', permissions: ['can_manage_menu', 'can_manage_orders', 'can_view_analytics', 'can_manage_staff', 'can_manage_settings'] },
      { role: 'staff', permissions: ['can_manage_orders', 'can_view_analytics'] },
      { role: 'cashier', permissions: ['can_manage_orders'] },
      { role: 'superadmin', permissions: ['can_manage_menu', 'can_manage_orders', 'can_view_analytics', 'can_manage_staff', 'can_manage_settings'] },
    ];

    for (const rm of roleMappings) {
      for (const pId of rm.permissions) {
        await query('SYSTEM', 'INSERT INTO role_permissions (role, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [rm.role, pId]);
      }
    }

    console.log('\n✨ PostgreSQL Seeder: Baseline complete.');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ PostgreSQL Seeder: Failed:', err);
    process.exit(1);
  }
}

async function seedMenuFromJson() {
  const menuJsonPath = join(process.cwd(), 'src', 'data', 'menu.json');
  if (!existsSync(menuJsonPath)) {
    console.warn(`⚠️  Menu file not found at ${menuJsonPath}. Skipping menu seed.`);
    return;
  }

  try {
    const raw = readFileSync(menuJsonPath, 'utf-8');
    const data = JSON.parse(raw);
    
    await transaction(DEFAULT_TENANT_ID, async (client) => {
      // 1. Categories
      const catMap = new Map<string, number>();
      
      for (const cat of data.categories) {
        // Manual existence check since we might not have a UNIQUE constraint on name
        const existing = await client.query(
          'SELECT id FROM categories WHERE tenant_id = $1 AND name = $2',
          [DEFAULT_TENANT_ID, cat.name]
        );

        if (existing.rows.length > 0) {
          catMap.set(cat.name, existing.rows[0].id);
        } else {
          const insertRes = await client.query(
            'INSERT INTO categories (tenant_id, name) VALUES ($1, $2) RETURNING id',
            [DEFAULT_TENANT_ID, cat.name]
          );
          catMap.set(cat.name, insertRes.rows[0].id);
        }
      }

      // 2. Menu Items
      for (const item of data.items) {
        const categoryId = catMap.get(item.category);
        if (!categoryId) continue;

        const existing = await client.query(
          'SELECT id FROM menu_items WHERE tenant_id = $1 AND name = $2 AND category_id = $3',
          [DEFAULT_TENANT_ID, item.name, categoryId]
        );

        if (existing.rows.length === 0) {
          await client.query(
            'INSERT INTO menu_items (tenant_id, category_id, name, price) VALUES ($1, $2, $3, $4)',
            [DEFAULT_TENANT_ID, categoryId, item.name, item.price]
          );
        }
      }
    });
    
    console.log('✅ Menu: Categories and Items synchronized from menu.json.');
  } catch (err) {
    console.error('❌ Failed to seed menu from JSON:', err);
  }
}

seed();
