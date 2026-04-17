import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/core/middleware/auth'
import { query } from '@/core/db/postgres'
import { getPlanFeatures, PLANS } from '@/core/plans'
import { emailQueue } from '@/core/worker/queues'
import type { PlanId } from '@/core/plans'

// ── GET /api/billing — current plan + usage ───────────────────────────────────
export const GET = requireAuth(async (req, { user, tenant }) => {
  const [tableCount, menuItemCount, ordersThisMonth] = await Promise.all([
    // Proxy: check max tables via tenant config
    Promise.resolve(tenant.config?.maxTables ?? 0),
    query(tenant.slug, 'SELECT COUNT(*) FROM menu_items').then(rows => parseInt((rows[0] as any).count)),
    query(tenant.slug, 'SELECT COUNT(*) FROM orders WHERE created_at >= $1', [
      new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    ]).then(rows => parseInt((rows[0] as any).count)),
  ])

  const plan = tenant.plan as PlanId
  const features = getPlanFeatures(plan)
  const planInfo = PLANS[plan]

  return NextResponse.json({
    currentPlan: plan,
    planName: planInfo.name,
    features,
    usage: {
      tables: { current: tableCount, max: features.maxTables },
      menuItems: { current: menuItemCount, max: features.maxMenuItems },
      ordersThisMonth,
    },
    planExpiresAt: tenant.planExpiresAt ?? null,
    allPlans: Object.entries(PLANS).map(([id, p]) => ({ id, name: p.name, features: p.features })),
  })
})

// ── POST /api/billing/upgrade — request upgrade (sends email to superadmin) ───
export const POST = requireAuth(async (req, { user, tenant }) => {
  const body = await req.json().catch(() => ({}))
  const { requestedPlan = 'pro' } = body

  if (!['starter', 'pro'].includes(requestedPlan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const superadminEmail = process.env.SUPERADMIN_EMAIL
  if (superadminEmail) {
    await emailQueue.add('upgrade-request', {
      to: superadminEmail,
      subject: `[NEXUS POS] Plan Upgrade Request — ${tenant.name}`,
      html: `
        <h2>Plan Upgrade Request</h2>
        <p><strong>Tenant:</strong> ${tenant.name} (${tenant.slug})</p>
        <p><strong>Requested by:</strong> ${user.email}</p>
        <p><strong>Current plan:</strong> ${tenant.plan}</p>
        <p><strong>Requested plan:</strong> ${requestedPlan}</p>
        <p>Log in to the admin panel to confirm the upgrade.</p>
      `,
    })
  }

  return NextResponse.json({
    success: true,
    message: 'Upgrade request submitted. Our team will process it within 24 hours.',
    requestedPlan,
  })
})
