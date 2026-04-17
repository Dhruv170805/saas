import { Injectable, BadRequestException } from '@nestjs/common';
import { query, transaction } from '@/core/db/postgres';

@Injectable()
export class BillingService {
  /**
   * Verified a manual payment and updates the tenant subscription lifecycle.
   */
  async verifyPayment(requestId: string, status: 'APPROVED' | 'REJECTED', superAdminId: string, notes?: string) {
    return transaction('SYSTEM', async (client) => {
      // 1. Fetch Request
      const reqRes = await client.query<{ status: string, tenant_id: string, plan_id: string, transaction_id: string }>(
        'SELECT * FROM payment_requests WHERE id = $1 FOR UPDATE',
        [requestId]
      );

      const rows = reqRes.rows;

      if (!rows.length || rows[0].status !== 'PENDING') {
        throw new BadRequestException('Invalid or already processed request');
      }

      const payment = rows[0];

      // 2. Update Request Status
      await client.query(
        'UPDATE payment_requests SET status = $1, notes = $2, verified_by = $3, updated_at = NOW() WHERE id = $4',
        [status, notes, superAdminId, requestId]
      );

      if (status === 'APPROVED') {
        // 3. Upsert Subscription (extend 30 days)
        const subRes = await client.query<{ current_period_end: Date }>(`
          INSERT INTO subscriptions (tenant_id, plan_id, status, current_period_start, current_period_end)
          VALUES ($1, $2, 'ACTIVE', NOW(), NOW() + INTERVAL '30 days')
          ON CONFLICT (tenant_id) DO UPDATE SET
            plan_id = EXCLUDED.plan_id,
            status = 'ACTIVE',
            current_period_end = GREATEST(subscriptions.current_period_end, NOW()) + INTERVAL '30 days',
            updated_at = NOW()
          RETURNING current_period_end
        `, [payment.tenant_id, payment.plan_id]);

        // 4. Synchronize Tenant Discovery Metadata (for Relentless Resilience fail-safe)
        await client.query(`
          UPDATE tenants 
          SET plan = $1, plan_expires_at = $2, updated_at = NOW() 
          WHERE id = $3
        `, [payment.plan_id, subRes.rows[0].current_period_end.toISOString(), payment.tenant_id]);
      }

      return { success: true };
    });
  }

  /**
   * List pending manual payments.
   */
  async getPendingPayments() {
    const data = await query('SYSTEM', `
      SELECT pr.*, t.name as tenant_name 
      FROM payment_requests pr
      JOIN tenants t ON pr.tenant_id = t.id
      WHERE pr.status = 'PENDING'
      ORDER BY pr.created_at ASC
    `);
    return { success: true, data };
  }
}
