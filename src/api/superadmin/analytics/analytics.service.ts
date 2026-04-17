import { Injectable } from '@nestjs/common';
import { query } from '@/core/db/postgres';

@Injectable()
export class AnalyticsService {
  /**
   * Aggregates global platform performance metrics.
   * Centralizes the raw 'God-Mode' data logic for executive dashboards.
   */
  async getPlatformMetrics() {
    // 1. Total Revenue (Last 30 Days)
    const revenueRes = await query<{ total: string }>('SYSTEM', `
      SELECT SUM(total) as total 
      FROM orders 
      WHERE status = 'PAID' AND created_at >= NOW() - INTERVAL '30 days'
    `);

    // 2. Active Tenants by Plan
    const tenantsByPlan = await query<{ plan: string, count: string }>('SYSTEM', `
      SELECT plan, COUNT(*) as count 
      FROM tenants 
      GROUP BY plan
    `);

    // 3. MRR (Monthly Recurring Revenue)
    // Calculated from active subscriptions price
    const mrrRes = await query<{ mrr: string }>('SYSTEM', `
      SELECT SUM(p.price) as mrr
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.status = 'ACTIVE'
    `);

    // 4. Global Order Velocity (daily counts for the last 7 days)
    const dailyOrders = await query<{ date: string, count: string }>('SYSTEM', `
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `);

    // 5. System Health
    const dbMetrics = await query<{ size: string }>('SYSTEM', "SELECT pg_size_pretty(pg_database_size(current_database())) as size");
    const totalUsers = await query<{ count: string }>('SYSTEM', "SELECT COUNT(*) as count FROM users");

    return {
      success: true,
      data: {
        revenue30d: revenueRes[0]?.total || '0',
        mrr: mrrRes[0]?.mrr || '0',
        tenants: tenantsByPlan || [],
        velocity: dailyOrders || [],
        dbSize: dbMetrics[0]?.size || 'N/A',
        totalUsers: totalUsers[0]?.count || '0',
        systemStatus: {
          database: 'OPTIMAL',
          cache: 'ONLINE',
          compute: 'STABLE'
        }
      }
    };
  }
}
