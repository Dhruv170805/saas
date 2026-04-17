import { fetcher } from '@/core/fetcher';
import { ServiceResult } from './types';

export interface HqAnalytics {
  tenants: Array<{ count: string; plan: string }>;
  revenue30d: string;
  // Add other fields as needed
}

export interface HqTenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  suspended: boolean;
}

export const hqService = {
  async getAnalytics(): Promise<ServiceResult<HqAnalytics>> {
    try {
      const res = await fetcher<any>('/hq/api/superadmin/analytics');
      if (res.success) {
        return { data: res.data };
      }
      return { error: res.error || 'Failed to fetch analytics' };
    } catch (error: any) {
      return {
        error: error.message || 'Failed to fetch analytics',
        status: error.status,
      };
    }
  },

  async getTenants(): Promise<ServiceResult<HqTenant[]>> {
    try {
      const res = await fetcher<any>('/hq/api/superadmin/tenants');
      if (res.success) {
        return { data: res.data };
      }
      return { error: res.error || 'Failed to fetch tenants' };
    } catch (error: any) {
      return {
        error: error.message || 'Failed to fetch tenants',
        status: error.status,
      };
    }
  },

  async toggleTenantStatus(id: string, action: 'activate' | 'suspend'): Promise<ServiceResult<{ success: boolean }>> {
    try {
      const res = await fetcher<any>(`/hq/api/superadmin/tenants/${id}/${action}`, {
        method: 'POST',
      });
      return { data: res };
    } catch (error: any) {
      return {
        error: error.message || `Failed to ${action} tenant`,
        status: error.status,
      };
    }
  },

  async login(payload: any): Promise<ServiceResult<any>> {
    try {
      const res = await fetcher<any>('/hq/api/superadmin/auth/login', {
        method: 'POST',
        body: payload,
      });
      return { data: res };
    } catch (error: any) {
      return {
        error: error.message || 'HQ Login failed',
        status: error.status,
      };
    }
  },
};
