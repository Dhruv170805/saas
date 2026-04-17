import { fetcher } from '@/core/fetcher';
import { 
  CategoryResponse, 
  CreateCategoryRequest, 
  CreateMenuItemRequest, 
  MenuItemResponse, 
  ServiceResult, 
  UpdateCategoryRequest, 
  UpdateMenuItemRequest 
} from './types';

export const menuService = {
  // Categories
  async getCategories(): Promise<ServiceResult<CategoryResponse[]>> {
    try {
      const data = await fetcher<CategoryResponse[]>('/api/categories');
      return { data };
    } catch (error: any) {
      return {
        error: error.message || 'Failed to fetch categories',
        status: error.status,
      };
    }
  },

  async createCategory(payload: CreateCategoryRequest): Promise<ServiceResult<CategoryResponse>> {
    try {
      const data = await fetcher<CategoryResponse>('/api/categories', {
        method: 'POST',
        body: payload,
      });
      return { data };
    } catch (error: any) {
      return {
        error: error.message || 'Failed to create category',
        status: error.status,
      };
    }
  },

  async updateCategory(id: number, payload: UpdateCategoryRequest): Promise<ServiceResult<CategoryResponse>> {
    try {
      const data = await fetcher<CategoryResponse>(`/api/categories?id=${id}`, {
        method: 'PATCH',
        body: payload,
      });
      return { data };
    } catch (error: any) {
      return {
        error: error.message || 'Failed to update category',
        status: error.status,
      };
    }
  },

  async deleteCategory(id: number): Promise<ServiceResult<void>> {
    try {
      await fetcher(`/api/categories?id=${id}`, { method: 'DELETE' });
      return { data: undefined };
    } catch (error: any) {
      return {
        error: error.message || 'Failed to delete category',
        status: error.status,
      };
    }
  },

  // Menu Items
  async getMenuItems(categoryId?: number): Promise<ServiceResult<MenuItemResponse[]>> {
    try {
      const url = categoryId ? `/api/menu?categoryId=${categoryId}` : '/api/menu';
      const data = await fetcher<MenuItemResponse[]>(url);
      return { data };
    } catch (error: any) {
      return {
        error: error.message || 'Failed to fetch menu items',
        status: error.status,
      };
    }
  },

  async createMenuItem(payload: CreateMenuItemRequest): Promise<ServiceResult<MenuItemResponse>> {
    try {
      const data = await fetcher<MenuItemResponse>('/api/menu', {
        method: 'POST',
        body: payload,
      });
      return { data };
    } catch (error: any) {
      return {
        error: error.message || 'Failed to create menu item',
        status: error.status,
      };
    }
  },

  async updateMenuItem(id: number, payload: UpdateMenuItemRequest): Promise<ServiceResult<MenuItemResponse>> {
    try {
      const data = await fetcher<MenuItemResponse>(`/api/menu/${id}`, {
        method: 'PATCH',
        body: payload,
      });
      return { data };
    } catch (error: any) {
      return {
        error: error.message || 'Failed to update menu item',
        status: error.status,
      };
    }
  },

  async deleteMenuItem(id: number): Promise<ServiceResult<void>> {
    try {
      await fetcher(`/api/menu/${id}`, { method: 'DELETE' });
      return { data: undefined };
    } catch (error: any) {
      return {
        error: error.message || 'Failed to delete menu item',
        status: error.status,
      };
    }
  },
};
