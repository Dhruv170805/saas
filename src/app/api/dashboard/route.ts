import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { getDashboardStats } from '@/core/db/tables'
import { handleApiError } from '@/core/errors'
import { requireAuth } from '@/core/middleware/auth'

export const GET = requireAuth(async (req, { tenant }) => {
  try {
    const stats = await getDashboardStats(tenant.id)
    return NextResponse.json(stats)
  } catch (error) {
    return handleApiError(error)
  }
})
