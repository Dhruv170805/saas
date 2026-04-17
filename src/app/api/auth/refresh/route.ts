import { NextRequest, NextResponse } from 'next/server'
import { verifyRefreshToken, signAccessToken, hashToken, verifyTokenHash } from '@/core/auth'
import { getUserById, verifyUserRefreshToken } from '@/core/db/users'
import { getTenantBySlug } from '@/core/db/tenants'

export async function POST(req: NextRequest) {
  const refreshToken =
    req.cookies.get('refresh_token')?.value ??
    (await req.json().catch(() => ({}))).refreshToken

  if (!refreshToken) {
    return NextResponse.json({ error: 'Refresh token required' }, { status: 401 })
  }

  let payload: { sub: string; tenantId: string }
  try {
    payload = await verifyRefreshToken(refreshToken) as { sub: string; tenantId: string }
  } catch {
    return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 })
  }

  // Get user (TenantId is required for RLS, but for refresh we might need to bypass or use the one from payload)
  const user = await getUserById(payload.tenantId, payload.sub)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 })

  // Verify token hash in DB
  const incomingHash = await hashToken(refreshToken)
  const isValid = await verifyUserRefreshToken(user.id, incomingHash)

  if (!isValid) {
    return NextResponse.json({ error: 'Refresh token revoked or not recognised' }, { status: 401 })
  }

  const tenant = await getTenantBySlug(payload.tenantId)
  if (!tenant || tenant.suspended) {
    return NextResponse.json({ error: 'Tenant unavailable' }, { status: 403 })
  }

  const newAccessToken = await signAccessToken({
    sub: user.id,
    tenantId: tenant.slug,
    roles: user.roles,
    email: user.email,
    name: user.name,
  })

  const res = NextResponse.json({ accessToken: newAccessToken })
  res.cookies.set('access_token', newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60,
    path: '/',
  })

  return res
}
