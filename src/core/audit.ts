
import { query } from './db/postgres'
import { DbAuditLog } from './db/schema'

export type AuditEventType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'IMPERSONATE'
  | 'PLAN_CHANGE'
  | 'USER_CREATED'
  | 'USER_DELETED'
  | 'TENANT_SUSPENDED'
  | 'TENANT_REACTIVATED'
  | 'ORDER_DELETED'
  | 'SETTINGS_CHANGED'
  | 'PASSWORD_RESET'
  | 'TOTP_ENABLED'
  | 'TENANT_CREATED'

export async function logAuditEvent(params: {
  type: AuditEventType
  actorId: string
  actorEmail: string
  tenantId: string
  targetId?: string
  payload?: Record<string, unknown>
  ip?: string
}): Promise<void> {
  try {
    const sql = `
      INSERT INTO audit_logs (tenant_id, actor_id, actor_email, type, target_id, payload, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    // Using SYSTEM context if tenantId might be 'SYSTEM' or during system-wide events
    const ctx = params.tenantId === 'SYSTEM' ? 'SYSTEM' : params.tenantId;
    await query(ctx, sql, [
      params.tenantId === 'SYSTEM' ? '00000000-0000-0000-0000-000000000000' : params.tenantId,
      params.actorId === 'anonymous' ? null : params.actorId,
      params.actorEmail,
      params.type,
      params.targetId || null,
      params.payload || null,
      params.ip || null
    ]);
  } catch (err: any) {
    // Non-fatal — never crash the request over an audit log failure
    console.error('⚠️  Failed to write audit log:', params.type, err.message)
  }
}

export async function getAuditLogs(tenantId?: string, limit = 100): Promise<DbAuditLog[]> {
  const ctx = tenantId || 'SYSTEM';
  const sql = `SELECT * FROM audit_logs ${tenantId ? 'WHERE tenant_id = $1' : ''} ORDER BY created_at DESC LIMIT $2`;
  const params = tenantId ? [tenantId, limit] : [limit];
  const rows = await query<any>(ctx, sql, params);
  return rows.map((r: any) => ({
    id: r.id,
    tenantId: r.tenant_id,
    actorId: r.actor_id,
    actorEmail: r.actor_email,
    type: r.type,
    targetId: r.target_id,
    payload: r.payload,
    ipAddress: r.ip_address,
    createdAt: r.created_at
  }));
}
