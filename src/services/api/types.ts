import { DbTenant, DbTenantConfig, DbTenantTheme, DbCategory, DbMenuItem, DbOrder, DbOrderItem } from '@/core/db/schema';

export interface ServiceResult<T> {
  data?: T;
  error?: string;
  status?: number;
}

// Auth
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[];
    permissions: string[];
  };
  token?: string;
}

export interface LoginRequest {
  email: string;
  password?: string;
  otp?: string;
}

// Tenant
export interface TenantResponse extends DbTenant {}

export interface UpdateTenantRequest {
  name?: string;
  theme?: Partial<DbTenantTheme>;
  config?: Partial<DbTenantConfig>;
}

// Menu & Categories
export interface CategoryResponse extends DbCategory {}

export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateCategoryRequest {
  name: string;
}

export interface MenuItemResponse extends DbMenuItem {}

export interface CreateMenuItemRequest {
  name: string;
  price: number;
  categoryId?: number;
  available?: boolean;
}

export interface UpdateMenuItemRequest {
  name?: string;
  price?: number;
  categoryId?: number;
  available?: boolean;
}

// Orders
export interface OrderResponse extends DbOrder {}

export interface CreateOrderRequest {
  tableNumber?: number;
  customerName?: string;
  customerPhone?: string;
  items: {
    menuItemId: number;
    quantity: number;
  }[];
}

export interface UpdateOrderStatusRequest {
  status: DbOrder['status'];
  paymentMethod?: string;
  customerName?: string;
  customerPhone?: string;
}

export interface AddOrderItemRequest {
  menuItemId: number;
  quantity: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
