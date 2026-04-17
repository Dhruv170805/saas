import { query } from './postgres'
import { DbCustomer } from './schema'

export async function upsertCustomerRecord(tenantId: string, name: string, phone: string, amountSpent: number): Promise<void> {
    // Format phone to extract numerical value (fallback to raw if formatting fails)
    const cleanPhone = phone.replace(/[^0-9+]/g, '')
    if (!cleanPhone) return // Skip if no valid phone number

    const sql = `
        INSERT INTO customers (tenant_id, name, phone, total_orders, total_spent, last_visit)
        VALUES ($1, $2, $3, 1, $4, NOW())
        ON CONFLICT (tenant_id, phone) DO UPDATE SET
            name = EXCLUDED.name,
            total_orders = customers.total_orders + 1,
            total_spent = customers.total_spent + EXCLUDED.total_spent,
            last_visit = NOW()
    `;

    await query(tenantId, sql, [tenantId, name, cleanPhone, amountSpent])
}

export async function getCustomers(tenantId: string): Promise<DbCustomer[]> {
    const sql = `SELECT * FROM customers WHERE tenant_id = $1 ORDER BY last_visit DESC`
    const rows = await query<any>(tenantId, sql, [tenantId])

    return rows.map((r: any) => ({
        id: r.id,
        tenantId: r.tenant_id,
        name: r.name,
        phone: r.phone,
        totalOrders: r.total_orders,
        totalSpent: parseFloat(r.total_spent),
        lastVisit: r.last_visit
    }))
}
