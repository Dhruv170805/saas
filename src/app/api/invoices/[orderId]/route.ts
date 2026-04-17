import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/core/middleware/auth'
import { query } from '@/core/db/postgres'
import { getFileStream, fileExists, storageKeys } from '@/core/storage'
import { DbOrder } from '@/core/db/schema'
import { invoiceQueue } from '@/core/worker/queues'
import { extractIntParam } from '@/core/params'

// ── GET /api/invoices/[orderId] — stream PDF ───────────────────────────────────
export const GET = requireAuth(async (req, { user, tenant }, params) => {
  const orderId = extractIntParam(params?.orderId)
  if (!orderId || isNaN(orderId)) return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })

  const orders = await query<DbOrder>(tenant.slug, 'SELECT * FROM orders WHERE id = $1', [orderId])
  const order = orders[0]
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const key = storageKeys.invoice(tenant.slug, orderId)
  const exists = await fileExists(key).catch(() => false)

  if (!exists) {
    // Enqueue generation if not yet available
    await invoiceQueue.add('generate', { orderId, tenantId: tenant.slug })
    return NextResponse.json(
      { message: 'Invoice is being generated. Try again in a few seconds.' },
      { status: 202 }
    )
  }

  // Stream PDF from MinIO
  const stream = await getFileStream(key)
  const chunks: Buffer[] = []
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    chunks.push(chunk)
  }
  const buffer = Buffer.concat(chunks)

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="invoice-${orderId}.pdf"`,
      'Content-Length': String(buffer.length),
      'Cache-Control': 'private, max-age=3600',
    },
  })
})
