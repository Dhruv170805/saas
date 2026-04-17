import { query, transaction } from './postgres'
import { DbTableInfo as TableInfo, DbDashboardStats as DashboardStats, DbOrder, DbOrderItem } from './schema'
import { getTenantById } from './tenants'

export async function getTables(tenantId: string): Promise<TableInfo[]> {
  const tenant = await getTenantById(tenantId)
  const tableCount = tenant?.config?.maxTables || 12

  const sql = `
    SELECT 
      id, 
      token_number as "tokenNumber", 
      table_number as "tableNumber", 
      total, 
      created_at as "createdAt",
      (SELECT COUNT(*) FROM order_items WHERE order_id = orders.id) as "itemCount"
    FROM orders
    WHERE tenant_id = $1 AND status = 'PENDING' AND table_number > 0
  `
  const docs = await query<any>(tenantId, sql, [tenantId])

  const activeOrders = new Map<
    number,
    { id: number; tokenNumber: number; total: number; itemCount: number; createdAt: string }
  >()
  for (const doc of docs) {
    activeOrders.set(doc.tableNumber, {
      id: doc.id,
      tokenNumber: doc.tokenNumber,
      total: parseFloat(doc.total),
      itemCount: parseInt(doc.itemCount),
      createdAt: doc.createdAt,
    })
  }

  const tables: TableInfo[] = []
  for (let i = 1; i <= tableCount; i++) {
    const order = activeOrders.get(i) || null
    tables.push({
      number: i,
      status: order ? 'occupied' : 'available',
      order,
    })
  }

  return tables
}

export async function getDashboardStats(tenantId: string): Promise<DashboardStats> {
  return await transaction(tenantId, async (client) => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // 1. Main Stats
    const statsSql = `
      SELECT
        COALESCE(SUM(total) FILTER (WHERE status = 'PAID' AND created_at >= $2), 0) as monthly_revenue,
        COUNT(*) FILTER (WHERE status IN ('PAID', 'UNPAID') AND created_at >= $2) as monthly_orders,
        COALESCE(SUM(total) FILTER (WHERE status = 'PAID' AND created_at >= $1), 0) as today_revenue,
        COALESCE(SUM(total) FILTER (WHERE status = 'PAID' AND created_at >= $1 AND payment_method = 'CASH'), 0) as cash_revenue,
        COALESCE(SUM(total) FILTER (WHERE status = 'PAID' AND created_at >= $1 AND payment_method = 'ONLINE'), 0) as online_revenue,
        COALESCE(SUM(total) FILTER (WHERE status = 'UNPAID' AND created_at >= $1), 0) as unpaid_revenue,
        COUNT(*) FILTER (WHERE created_at >= $1) as today_orders,
        COUNT(*) FILTER (WHERE status = 'PENDING' AND created_at >= $1) as pending_orders,
        COALESCE(SUM(total) FILTER (WHERE status = 'PAID' AND created_at >= $3 AND created_at < $1), 0) as yesterday_revenue,
        AVG(total) FILTER (WHERE status = 'PAID') as avg_order_value
      FROM orders
      WHERE tenant_id = $4
    `
    const statsRes = await client.query(statsSql, [todayStart, monthStart, yesterdayStart, tenantId])
    const stats = statsRes.rows[0]

    // 2. Top Selling Items (7-day window)
    const topItemsSql = `
      SELECT 
        name,
        SUM(quantity) as qty,
        SUM(price * quantity) as revenue
      FROM order_items
      WHERE tenant_id = $1 AND order_id IN (
        SELECT id FROM orders WHERE status = 'PAID' AND created_at >= $2
      )
      GROUP BY name
      ORDER BY qty DESC
      LIMIT 5
    `
    const topItemsRes = await client.query(topItemsSql, [tenantId, sevenDaysAgo])

    // 3. Recent Orders (Today)
    const recentOrdersSql = `
      SELECT * FROM orders 
      WHERE tenant_id = $1 AND created_at >= $2
      ORDER BY created_at DESC
      LIMIT 10
    `
    const recentOrdersRes = await client.query(recentOrdersSql, [tenantId, todayStart])

    // 4. All unpaid orders
    const unpaidOrdersSql = `
      SELECT * FROM orders 
      WHERE tenant_id = $1 AND status = 'UNPAID'
      ORDER BY created_at DESC
    `
    const unpaidOrdersRes = await client.query(unpaidOrdersSql, [tenantId])

    // 5. Weekly Data (7-day window)
    const weeklyDataSql = `
      SELECT total, created_at
      FROM orders
      WHERE tenant_id = $1 AND status = 'PAID' AND created_at >= $2
    `
    const weeklyDataRes = await client.query(weeklyDataSql, [tenantId, sevenDaysAgo])

    // 6. Hourly Revenue (Today)
    const hourlyRevenueSql = `
      SELECT EXTRACT(HOUR FROM created_at) as hour, SUM(total) as revenue
      FROM orders
      WHERE tenant_id = $1 AND status = 'PAID' AND created_at >= $2
      GROUP BY hour
      ORDER BY hour ASC
    `
    const hourlyRevenueRes = await client.query(hourlyRevenueSql, [tenantId, todayStart])
    const hourlyRevenue: Record<number, number> = {}
    hourlyRevenueRes.rows.forEach((r: any) => {
      hourlyRevenue[parseInt(r.hour)] = parseFloat(r.revenue)
    })

    // 7. Table Stats (Total and Occupied)
    const tenant = await getTenantById(tenantId)
    const totalTables = tenant?.config?.maxTables || 12
    const occupiedTablesSql = `
      SELECT COUNT(DISTINCT table_number) as occupied
      FROM orders
      WHERE tenant_id = $1 AND status = 'PENDING' AND table_number > 0
    `
    const occupiedTablesRes = await client.query(occupiedTablesSql, [tenantId])
    const occupiedTables = parseInt(occupiedTablesRes.rows[0].occupied)

    // Calculate weekly avg
    const weeklyTotals = [0, 0, 0, 0, 0, 0, 0]
    const weeklyCounts = [0, 0, 0, 0, 0, 0, 0]
    for (const o of weeklyDataRes.rows) {
      const day = new Date(o.created_at).getDay()
      weeklyTotals[day] += parseFloat(o.total)
      weeklyCounts[day]++
    }
    const weeklyAvg = weeklyTotals.map((t, i) => (weeklyCounts[i] > 0 ? Math.round(t / weeklyCounts[i]) : 0))

    const mapOrder = (o: any): DbOrder => ({
      id: o.id,
      tenantId: o.tenant_id,
      tokenNumber: o.token_number,
      tableNumber: o.table_number,
      status: o.status,
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      subtotal: parseFloat(o.subtotal),
      tax: parseFloat(o.tax),
      total: parseFloat(o.total),
      createdAt: o.created_at,
      updatedAt: o.updated_at,
      paymentMethod: o.payment_method,
      pdfUrl: o.pdf_url
    })

    return {
      todayRevenue: parseFloat(stats.today_revenue),
      monthlyRevenue: parseFloat(stats.monthly_revenue),
      cashRevenue: parseFloat(stats.cash_revenue),
      onlineRevenue: parseFloat(stats.online_revenue),
      unpaidRevenue: parseFloat(stats.unpaid_revenue),
      todayOrders: parseInt(stats.today_orders),
      monthlyOrders: parseInt(stats.monthly_orders),
      pendingOrders: parseInt(stats.pending_orders),
      yesterdayRevenue: parseFloat(stats.yesterday_revenue || 0),
      avgOrderValue: Math.round(parseFloat(stats.avg_order_value || 0)),
      topItems: topItemsRes.rows.map((i: any) => ({
        name: i.name,
        qty: parseInt(i.qty),
        revenue: parseFloat(i.revenue)
      })),
      weeklyAvg,
      hourlyRevenue,
      recentOrders: recentOrdersRes.rows.map(mapOrder),
      unpaidOrders: unpaidOrdersRes.rows.map(mapOrder),
      tables: {
        total: totalTables,
        occupied: occupiedTables
      }
    }
  })
}
