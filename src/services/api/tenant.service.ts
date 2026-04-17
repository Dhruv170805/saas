import { fetcher } from '@/core/fetcher';
import { ServiceResult, TenantResponse, UpdateTenantRequest } from './types';

export const tenantService = {
  async getTenant(): Promise<ServiceResult<TenantResponse>> {
    try {
      const data = await fetcher<TenantResponse>('/api/tenant');
      return { data };
    } catch (error: any) {
      return {
        error: error.message || 'Failed to fetch tenant settings',
        status: error.status,
      };
    }
  },

  async updateTenant(payload: UpdateTenantRequest): Promise<ServiceResult<TenantResponse>> {
    try {
      const data = await fetcher<TenantResponse>('/api/tenant', {
        method: 'PATCH',
        body: payload,
      });
      return { data };
    } catch (error: any) {
      return {
        error: error.message || 'Failed to update tenant settings',
        status: error.status,
      };
    }
  },

  async getSettings(): Promise<ServiceResult<any>> {
    try {
      const data = await fetcher<any>('/api/settings');
      return { data };
    } catch (error: any) {
      return {
        error: error.message || 'Failed to fetch settings',
        status: error.status,
      };
    }
  },

  async getTables(): Promise<ServiceResult<any[]>> {
    try {
      const data = await fetcher<any[]>('/api/tables');
      return { data };
    } catch (error: any) {
      return {
        error: error.message || 'Failed to fetch tables',
        status: error.status,
      };
    }
  },

  async getDashboardStats(): Promise<ServiceResult<any>> {
    try {
      const data = await fetcher<any>('/api/dashboard');
      return { data };
    } catch (error: any) {
      return {
        error: error.message || 'Failed to fetch dashboard stats',
        status: error.status,
      };
    }
  },

  async uploadLogo(file: File): Promise<ServiceResult<{ logoUrl: string; primaryColor: string }>> {
    try {
      const formData = new FormData();
      formData.append('logo', file);
      
      const res = await fetch('/api/tenant/logo', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to upload logo');
      }
      
      const data = await res.json();
      return { data };
    } catch (error: any) {
      return {
        error: error.message || 'Logo upload failed',
      };
    }
  },
};
