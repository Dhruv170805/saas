import { NextResponse } from 'next/server'
import {
  getOrders,
  getOrdersPaginated,
  createOrder,
  addItemsToOrder,
} from '@/core/db/orders'
import { getMenuItem } from '@/core/db/menu'
import { handleApiError } from '@/core/errors'
import { ValidationError } from '@/core/errors'
import { validatePositiveInteger, validateOptionalStringLength } from '@/core/validation'
import { requireAuth } from '@/core/middleware/auth'

export const GET = requireAuth(async (req, { tenant }) => {
  try {
    const { searchParams } = new URL(req.url)
    const page = searchParams.get('page')
    const limit = searchParams.get('limit')

    if (page || limit) {
      const p = page ? parseInt(page) : 1
      const l = limit ? parseInt(limit) : 50
      if (isNaN(p) || p < 1) throw new ValidationError('page must be a positive integer')
      const result = await getOrdersPaginated(tenant.id, p, l)
      return NextResponse.json({ orders: result, page: p, limit: l })
    }

    const orders = await getOrders(tenant.id)
    return NextResponse.json(orders)
  } catch (error) {
    return handleApiError(error)
  }
})

export const POST = requireAuth(async (req, { tenant }) => {
  try {
    const body = await req.json()
    const { items, tableNumber, orderId } = body

    const customerName = validateOptionalStringLength(body.customerName, 'Customer Name', 2, 100)
    const customerPhone = validateOptionalStringLength(body.customerPhone, 'Customer Phone', 5, 20)

    // Validate table number
    const validTable = validatePositiveInteger(tableNumber, 'Table number')

    // Map input items
    const validatedItems = Array.isArray(items) ? items : []

    // Verify each item exists in the menu
    for (const item of validatedItems) {
      const menuItem = await getMenuItem(tenant.slug, item.id)
      if (!menuItem) {
        throw new ValidationError(`Menu item #${item.id} does not exist`, { itemId: item.id })
      }
    }

    const orderItems = validatedItems.map((item) => ({
      menuItemId: item.id,
      quantity: item.quantity,
    })) as any[]

    if (orderId) {
      const updatedOrder = await addItemsToOrder(tenant.id, orderId, orderItems)
      return NextResponse.json(updatedOrder, { status: 200 })
    } else {
      // Create a new order
      const order = await createOrder(
        tenant.id,
        orderItems,
        0,
        validTable,
        customerName,
        customerPhone
      )
      return NextResponse.json(order, { status: 201 })
    }
  } catch (error) {
    return handleApiError(error)
  }
})
