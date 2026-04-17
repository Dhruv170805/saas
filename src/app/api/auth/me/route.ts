import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/core/middleware/auth'
import { getUserById, getUserPermissions } from '@/core/db/users'

export const GET = requireAuth(async (req, { user, tenant }) => {
  const fullUser = await getUserById(tenant.slug, user.sub!)
  if (!fullUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const permissions = await getUserPermissions(fullUser.roles);

  return NextResponse.json({
    id: fullUser.id,
    email: fullUser.email,
    name: fullUser.name,
    roles: fullUser.roles,
    permissions,
    totpEnabled: fullUser.totpEnabled,
    emailVerified: fullUser.emailVerified,
    tenantId: fullUser.tenantId,
    tenant: {
      slug: tenant.slug,
      name: tenant.name,
      plan: tenant.plan,
      theme: tenant.theme,
      logoUrl: tenant.logoUrl,
    },
  })
})
