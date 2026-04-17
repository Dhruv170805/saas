import { fetcher } from '@/core/fetcher';
import { AuthResponse, LoginRequest, ServiceResult } from './types';

export const authService = {
  async login(credentials: LoginRequest): Promise<ServiceResult<AuthResponse>> {
    try {
      const data = await fetcher<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: credentials,
      });
      return { data };
    } catch (error: any) {
      return {
        error: error.message || 'Login failed',
        status: error.status,
      };
    }
  },

  async logout(): Promise<ServiceResult<void>> {
    try {
      await fetcher('/api/auth/logout', { method: 'POST' });
      return { data: undefined };
    } catch (error: any) {
      return {
        error: error.message || 'Logout failed',
        status: error.status,
      };
    }
  },

  async refresh(): Promise<ServiceResult<AuthResponse>> {
    try {
      const data = await fetcher<AuthResponse>('/api/auth/refresh', {
        method: 'POST',
      });
      return { data };
    } catch (error: any) {
      return {
        error: error.message || 'Session refresh failed',
        status: error.status,
      };
    }
  },

  async getSession(): Promise<ServiceResult<AuthResponse>> {
    try {
      const data = await fetcher<AuthResponse>('/api/auth/me');
      return { data };
    } catch (error: any) {
      return {
        error: error.message || 'Failed to get session status',
        status: error.status,
      };
    }
  },
};
