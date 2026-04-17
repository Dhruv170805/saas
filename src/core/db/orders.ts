import { query, transaction } from './postgres';
import { PaginatedOrders } from '@/types';
import { Order, OrderItem } from '@/core/db';
import { DbOrder, DbMenuItem, DbOrderItem } from './schema';
import { upsertCustomerRecord } from './customers';
import { emitEvent } from '../socket';

export async function getOrders(tenantId: string): Promise<Order[]> {
  return (await getOrdersPaginated(tenantId, 1, 1000)).orders;
}

export async function getOrdersPaginated(
  tenantId: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedOrders> {
  const offset = (page - 1) * limit;

  const countSql = `SELECT COUNT(*) FROM orders WHERE tenant_id = $1`;
  const countRes = await query<{ count: string }>(tenantId, countSql, [tenantId]);
  const total = parseInt(countRes[0].count);

  const sql = `
    SELECT * FROM orders 
    WHERE tenant_id = $1 
    ORDER BY created_at DESC 
    LIMIT $2 OFFSET $3
  `;
  const rows = await query<any>(tenantId, sql, [tenantId, limit, offset]);
  
  const orders = await Promise.all(rows.map(row => mapOrder(tenantId, row)));

  return {
    orders: orders as unknown as Order[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getOrdersByDateRange(tenantId: string, from: string, to: string): Promise<Order[]> {
  const sql = `
    SELECT * FROM orders 
    WHERE tenant_id = $1 AND created_at >= $2 AND created_at <= $3
    ORDER BY created_at DESC
  `;
  const rows = await query<any>(tenantId, sql, [tenantId, from, to]);
  const orders = await Promise.all(rows.map(row => mapOrder(tenantId, row)));
  return orders as unknown as Order[];
}

export async function getOrder(id: number, tenantId: string): Promise<Order | undefined> {
  const sql = `SELECT * FROM orders WHERE id = $1 AND tenant_id = $2 LIMIT 1`;
  const rows = await query<any>(tenantId, sql, [id, tenantId]);
  if (!rows[0]) return undefined;
  const order = await mapOrder(tenantId, rows[0]);
  return order as unknown as Order;
}

export async function getPublicOrder(id: number): Promise<Order | undefined> {
  const sql = `SELECT * FROM orders WHERE id = $1 LIMIT 1`;
  const rows = await query<any>('SYSTEM', sql, [id]);
  if (!rows[0]) return undefined;
  const order = await mapOrder(rows[0].tenant_id, rows[0]);
  return order as unknown as Order;
}

export async function createOrder(
  tenantId: string,
  items: OrderItem[],
  _clientTotal: number,
  tableNumber: number | null,
  customerName?: string,
  customerPhone?: string
): Promise<Order> {
  return await transaction(tenantId, async (client) => {
    // 1. Calculate server-side totals
    let subtotal = 0;
    const processedItems = [];
    
    for (const item of items) {
      const itemRes = await client.query(
        'SELECT name, price FROM menu_items WHERE id = $1 AND tenant_id = $2',
        [item.menuItemId, tenantId]
      );
      
      if (itemRes.rows.length === 0) throw new Error(`Menu item ${item.menuItemId} not found`);
      
      const mi = itemRes.rows[0];
      const price = parseFloat(mi.price);
      subtotal += price * item.quantity;
      
      processedItems.push({
        menuItemId: item.menuItemId,
        name: mi.name,
        price,
        quantity: item.quantity
      });
    }

    const total = subtotal; // Tax can be added
    
    // 2. Daily Token Number
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const tokenRes = await client.query(
      'SELECT COUNT(*) as count FROM orders WHERE tenant_id = $1 AND created_at >= $2',
      [tenantId, startOfDay]
    );
    const tokenNumber = parseInt(tokenRes.rows[0].count) + 1;

    // 3. Insert Order
    const orderSql = `
      INSERT INTO orders (tenant_id, token_number, table_number, status, subtotal, total, customer_name, customer_phone)
      VALUES ($1, $2, $3, 'PENDING', $4, $5, $6, $7)
      RETURNING *
    `;
    const orderRes = await client.query(orderSql, [
      tenantId,
      tokenNumber,
      tableNumber,
      subtotal,
      total,
      customerName || null,
      customerPhone || null
    ]);
    const order = orderRes.rows[0];

    // 4. Insert Order Items
    for (const pi of processedItems) {
      const itemSql = `
        INSERT INTO order_items (tenant_id, order_id, menu_item_id, name, price, quantity)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await client.query(itemSql, [
        tenantId,
        order.id,
        pi.menuItemId,
        pi.name,
        pi.price,
        pi.quantity
      ]);
    }

    const finalOrder = await mapOrder(tenantId, order, processedItems);
    emitEvent('ORDER_UPDATED', { orderId: order.id, type: 'CREATED', tableNumber });
    return finalOrder as unknown as Order;
  });
}

export async function addItemsToOrder(tenantId: string, orderId: number, items: OrderItem[]): Promise<Order> {
  return await transaction(tenantId, async (client) => {
    const orderRes = await client.query(
      'SELECT * FROM orders WHERE id = $1 AND tenant_id = $2 FOR UPDATE',
      [orderId, tenantId]
    );
    if (orderRes.rows.length === 0) throw new Error('Order not found');
    const order = orderRes.rows[0];
    if (order.status !== 'PENDING') throw new Error('Can only add to PENDING orders');

    let addedSubtotal = 0;
    
    for (const item of items) {
      const itemRes = await client.query(
        'SELECT name, price FROM menu_items WHERE id = $1 AND tenant_id = $2',
        [item.menuItemId, tenantId]
      );
      if (itemRes.rows.length === 0) throw new Error(`Item ${item.menuItemId} not found`);
      
      const mi = itemRes.rows[0];
      const price = parseFloat(mi.price);
      addedSubtotal += price * item.quantity;

      // Check if item already exists in this order
      const existingRes = await client.query(
          'SELECT id, quantity FROM order_items WHERE order_id = $1 AND menu_item_id = $2',
          [orderId, item.menuItemId]
      );

      if (existingRes.rows.length > 0) {
          await client.query(
              'UPDATE order_items SET quantity = quantity + $1 WHERE id = $2',
              [item.quantity, existingRes.rows[0].id]
          );
      } else {
          await client.query(
            `INSERT INTO order_items (tenant_id, order_id, menu_item_id, name, price, quantity)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [tenantId, orderId, item.menuItemId, mi.name, mi.price, item.quantity]
          );
      }
    }

    const newSubtotal = parseFloat(order.subtotal) + addedSubtotal;
    const newTotal = newSubtotal; 
    
    const updateRes = await client.query(
      'UPDATE orders SET subtotal = $1, total = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [newSubtotal, newTotal, orderId]
    );

    const updatedOrder = await mapOrder(tenantId, updateRes.rows[0]);
    emitEvent('ORDER_UPDATED', { orderId, type: 'ITEMS_ADDED', tableNumber: updatedOrder.tableNumber });
    return updatedOrder as unknown as Order;
  });
}

export async function updateOrderStatus(
  tenantId: string,
  id: number,
  status: 'PENDING' | 'PAID' | 'UNPAID' | 'CANCELLED',
  paymentMethod?: 'CASH' | 'ONLINE' | 'UNPAID',
  updates?: { customerName?: string; customerPhone?: string }
): Promise<Order | null> {
  const keys = ['status', 'updated_at'];
  const values: any[] = [status, new Date()];
  
  if (paymentMethod) {
      keys.push('payment_method');
      values.push(paymentMethod);
  }
  if (updates?.customerName) {
      keys.push('customer_name');
      values.push(updates.customerName);
  }
  if (updates?.customerPhone) {
      keys.push('customer_phone');
      values.push(updates.customerPhone);
  }

  const setClause = keys.map((k, i) => `${k} = $${i + 3}`).join(', ');
  const sql = `UPDATE orders SET ${setClause} WHERE id = $1 AND tenant_id = $2 RETURNING *`;
  
  const rows = await query<any>(tenantId, sql, [id, tenantId, ...values]);
  if (!rows[0]) return null;

  const order = await mapOrder(tenantId, rows[0]);

  if (status === 'PAID' && order.customerName && order.customerPhone) {
      upsertCustomerRecord(tenantId, order.customerName, order.customerPhone, order.total)
          .catch(e => console.error('Failed CRM update:', e));
  }

  emitEvent('ORDER_UPDATED', { orderId: id, type: 'STATUS_UPDATED', status, tableNumber: order.tableNumber });
  return order as unknown as Order;
}

export async function deleteOrder(tenantId: string, id: number): Promise<boolean> {
  const sql = `DELETE FROM orders WHERE id = $1 AND tenant_id = $2`;
  await query(tenantId, sql, [id, tenantId]);
  return true;
}

export async function markKOTPrinted(tenantId: string, orderId: number): Promise<Order | null> {
  await query(tenantId, `UPDATE order_items SET printed_quantity = quantity WHERE order_id = $1`, [orderId]);
  const order = await getOrder(orderId, tenantId);
  if (order) {
    emitEvent('ORDER_UPDATED', { orderId, type: 'KOT_PRINTED', tableNumber: order.tableNumber });
  }
  return order || null;
}

/**
 * Helper to map DB row and its items to Order interface.
 */
async function mapOrder(tenantId: string, row: any, items?: any[]): Promise<any> {
    if (!items) {
        const itemSql = `SELECT * FROM order_items WHERE order_id = $1`;
        items = await query<any>(tenantId, itemSql, [row.id]);
    }

    return {
        id: row.id,
        tenantId: row.tenant_id,
        tokenNumber: row.token_number,
        tableNumber: row.table_number,
        status: row.status,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        subtotal: parseFloat(row.subtotal),
        tax: parseFloat(row.tax),
        total: parseFloat(row.total),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        paymentMethod: row.payment_method,
        pdfUrl: row.pdf_url,
        items: items.map(i => ({
            menuItemId: i.menu_item_id,
            name: i.name,
            price: parseFloat(i.price),
            quantity: i.quantity,
            printedQuantity: i.printed_quantity
        })),
        itemCount: items.reduce((acc, i) => acc + i.quantity, 0)
    };
}
