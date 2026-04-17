import { fetcher } from '@/core/fetcher';
import { 
  AddOrderItemRequest, 
  CreateOrderRequest, 
  OrderResponse, 
  ServiceResult, 
  UpdateOrderStatusRequest 
} from './types';

export const orderService = {
  async getOrders(params?: { status?: string; tableNumber?: number }): Promise<ServiceResult<OrderResponse[]>> {
    try {
      const query = new URLSearchParams();
      if (params?.status) query.append('status', params.status);
      if (params?.tableNumber) query.append('tableNumber', params.tableNumber.toString());
      
      const url = query.toString() ? `/api/orders?${query.toString()}` : '/api/orders';
      const data = await fetcher<OrderResponse[]>(url);
      return { data };
    } catch (error: any) {
      return {
        error: error.message || 'Failed to fetch orders',
        status: error.status,
      };
    }
  },

  async getOrder(id: number): Promise<ServiceResult<OrderResponse>> {
    try {
      const data = await fetcher<OrderResponse>(`/api/orders/${id}`);
      return { data };
    } catch (error: any) {
      return {
        error: error.message || `Failed to fetch order #${id}`,
        status: error.status,
      };
    }
  },

  async createOrder(payload: CreateOrderRequest): Promise<ServiceResult<OrderResponse>> {
    try {
      const data = await fetcher<OrderResponse>('/api/orders', {
        method: 'POST',
        body: payload,
      });
      return { data };
    } catch (error: any) {
      return {
        error: error.message || 'Failed to create order',
        status: error.status,
      };
    }
  },

  async updateOrderStatus(id: number, payload: UpdateOrderStatusRequest): Promise<ServiceResult<OrderResponse>> {
    try {
      const data = await fetcher<OrderResponse>(`/api/orders/${id}`, {
        method: 'PATCH',
        body: payload,
      });
      return { data };
    } catch (error: any) {
      return {
        error: error.message || `Failed to update order #${id} status`,
        status: error.status,
      };
    }
  },

  async addOrderItems(id: number, items: AddOrderItemRequest[]): Promise<ServiceResult<OrderResponse>> {
    try {
      const data = await fetcher<OrderResponse>(`/api/orders/${id}/kot`, {
        method: 'PUT',
        body: { items },
      });
      return { data };
    } catch (error: any) {
      return {
        error: error.message || `Failed to add items to order #${id}`,
        status: error.status,
      };
    }
  },

  async cancelOrder(id: number): Promise<ServiceResult<void>> {
    try {
      await fetcher(`/api/orders/${id}`, {
        method: 'PATCH',
        body: { status: 'CANCELLED' },
      });
      return { data: undefined };
    } catch (error: any) {
      return {
        error: error.message || `Failed to cancel order #${id}`,
        status: error.status,
      };
    }
  },
};
