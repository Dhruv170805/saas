import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

/**
 * HQ DATA HOOKS: Centralized state management for the Control Plane.
 * Leverages SWR for automatic revalidation, caching, and optimistic UI.
 */

export function useHqAnalytics() {
  const { data, error, isLoading, mutate } = useSWR('/hq/api/superadmin/analytics', fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 30000,
  });

  return {
    analytics: data?.success ? data.data : null,
    isSimulation: data?.isSimulation || false,
    isLoading,
    isError: error || (data && !data.success && !data.isSimulation),
    mutate
  };
}

export function useHqTenants() {
  const { data, error, isLoading, mutate } = useSWR('/hq/api/superadmin/tenants', fetcher, {
    revalidateOnFocus: true,
  });

  return {
    tenants: data?.success ? data.data : [],
    isSimulation: data?.isSimulation || false,
    isLoading,
    isError: error || (data && !data.success && !data.isSimulation),
    mutate
  };
}

export function useHqPayments() {
  const { data, error, isLoading, mutate } = useSWR('/hq/api/superadmin/payments', fetcher, {
    revalidateOnFocus: true,
  });

  return {
    payments: data?.success ? data.data : [],
    isSimulation: data?.isSimulation || false,
    isLoading,
    isError: error || (data && !data.success && !data.isSimulation),
    mutate
  };
}
