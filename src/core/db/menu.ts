import { query } from './postgres';
import { Category, MenuItem } from '@/core/db';
import { DbCategory, DbMenuItem } from './schema';

export async function getCategories(tenantId: string): Promise<Category[]> {
  const sql = `
    SELECT c.*, (SELECT COUNT(*) FROM menu_items WHERE category_id = c.id) as item_count
    FROM categories c
    WHERE tenant_id = $1
    ORDER BY id ASC
  `;
  const rows = await query<any>(tenantId, sql, [tenantId]);
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    itemCount: parseInt(row.item_count)
  })) as unknown as Category[];
}

export async function addCategory(tenantId: string, name: string): Promise<Category> {
  const sql = `INSERT INTO categories (tenant_id, name) VALUES ($1, $2) RETURNING *`;
  const rows = await query<DbCategory>(tenantId, sql, [tenantId, name]);
  const c = rows[0];
  return { id: c.id, name: c.name, itemCount: 0 } as unknown as Category;
}

export async function updateCategory(tenantId: string, id: number, name: string): Promise<Category | null> {
  const sql = `UPDATE categories SET name = $1 WHERE id = $2 AND tenant_id = $3 RETURNING *`;
  const rows = await query<DbCategory>(tenantId, sql, [name, id, tenantId]);
  if (!rows[0]) return null;
  const c = rows[0];
  // We don't easily have itemCount here without another query, but usually UI just needs name/id after update
  return { id: c.id, name: c.name } as unknown as Category;
}

export async function deleteCategory(tenantId: string, id: number): Promise<boolean> {
  // Check if items exist (Postgres FK might also prevent this, but we'll be explicit as per original logic)
  const checkSql = `SELECT COUNT(*) FROM menu_items WHERE category_id = $1 AND tenant_id = $2`;
  const checkRows = await query<{ count: string }>(tenantId, checkSql, [id, tenantId]);
  if (parseInt(checkRows[0].count) > 0) return false;

  const sql = `DELETE FROM categories WHERE id = $1 AND tenant_id = $2`;
  await query(tenantId, sql, [id, tenantId]);
  return true;
}

export async function getMenuItems(tenantId: string): Promise<MenuItem[]> {
  const sql = `
    SELECT m.*, c.name as category_name
    FROM menu_items m
    JOIN categories c ON m.category_id = c.id
    WHERE m.tenant_id = $1
    ORDER BY m.category_id ASC, m.name ASC
  `;
  const rows = await query<any>(tenantId, sql, [tenantId]);
  return rows.map(m => ({
    id: m.id,
    name: m.name,
    price: parseFloat(m.price),
    categoryId: m.category_id,
    available: m.available,
    category: { id: m.category_id, name: m.category_name }
  })) as unknown as MenuItem[];
}

export async function getMenuItem(tenantId: string, id: number): Promise<MenuItem | undefined> {
  const sql = `
    SELECT m.*, c.name as category_name
    FROM menu_items m
    JOIN categories c ON m.category_id = c.id
    WHERE m.id = $1 AND m.tenant_id = $2
  `;
  const rows = await query<any>(tenantId, sql, [id, tenantId]);
  if (!rows[0]) return undefined;
  const m = rows[0];
  return {
    id: m.id,
    name: m.name,
    price: parseFloat(m.price),
    categoryId: m.category_id,
    available: m.available,
    category: { id: m.category_id, name: m.category_name }
  } as unknown as MenuItem;
}

export async function addMenuItem(
  tenantId: string,
  name: string,
  price: number,
  categoryId: number
): Promise<MenuItem | null> {
  // Verify category exists
  const catSql = `SELECT name FROM categories WHERE id = $1 AND tenant_id = $2`;
  const catRows = await query<DbCategory>(tenantId, catSql, [categoryId, tenantId]);
  if (!catRows[0]) return null;

  const sql = `
    INSERT INTO menu_items (tenant_id, name, price, category_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const rows = await query<any>(tenantId, sql, [tenantId, name, price, categoryId]);
  const m = rows[0];
  return {
    id: m.id,
    name: m.name,
    price: parseFloat(m.price),
    categoryId: m.category_id,
    available: m.available,
    category: { id: categoryId, name: catRows[0].name }
  } as unknown as MenuItem;
}

export async function updateMenuItem(
  tenantId: string,
  id: number,
  updates: { name?: string; price?: number; categoryId?: number; available?: boolean }
): Promise<MenuItem | null> {
    const keys = Object.keys(updates).filter(k => ['name', 'price', 'categoryId', 'available'].includes(k));
    if (keys.length === 0) return await getMenuItem(tenantId, id) || null;

    const setClause = keys.map((key, i) => {
        const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        return `${dbKey} = $${i + 3}`;
    }).join(', ');
    
    const values = keys.map(k => (updates as any)[k]);

    const sql = `UPDATE menu_items SET ${setClause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    await query(tenantId, sql, [id, tenantId, ...values]);
    
    return (await getMenuItem(tenantId, id)) || null;
}

export async function deleteMenuItem(tenantId: string, id: number): Promise<boolean> {
  const sql = `DELETE FROM menu_items WHERE id = $1 AND tenant_id = $2`;
  const result = await query(tenantId, sql, [id, tenantId]);
  return true; // Postgres query doesn't return count directly here in this helper but we assume success if no throw
}
