import { NextResponse } from 'next/server'
import { requireAdmin } from '@/core/middleware/auth'
import { uploadFile, storageKeys } from '@/core/storage'
import { updateTenant } from '@/core/db/tenants'

const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB

export const POST = requireAdmin(async (req, { tenant }) => {
  const formData = await req.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ error: 'Multipart form data required' }, { status: 400 })
  }

  const file = (formData as any).get('logo') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No logo file provided' }, { status: 400 })
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Logo must be under 2 MB' }, { status: 413 })
  }

  const allowed = ['image/png', 'image/jpeg', 'image/webp']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Only PNG, JPEG, WebP allowed for AI color extraction' }, { status: 415 })
  }

  const ext = file.type.split('/')[1]
  const key = storageKeys.logo(tenant.id, ext)
  const buffer = Buffer.from(await file.arrayBuffer())

  // ── AI Color Extraction ───────────────────────────────────────────────────
  let primaryColor = tenant.theme?.primary || '#f37c22'
  try {
    const { Vibrant } = await import('node-vibrant/node')
    const palette = await Vibrant.from(buffer).getPalette()
    if (palette.Vibrant) {
      primaryColor = palette.Vibrant.hex
    }
  } catch (err) {
    console.error('AI Color Extraction failed:', err)
    // Fallback to existing or default
  }

  await uploadFile(key, buffer, file.type)

  const logoUrl = `/api/storage/${key}`
  
  // ── Update PostgreSQL Tenant Atomic Theme ─────────────────────────────────
  await updateTenant(tenant.id, { 
    logoUrl,
    theme: { 
      ...tenant.theme, 
      primary: primaryColor 
    } 
  })

  return NextResponse.json({ success: true, logoUrl, primaryColor })
})