import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { menuService, orderService, tenantService, hqService, authService, TenantResponse, UpdateTenantRequest } from '@/services/api'
import type { TableInfo, AppSettings, MenuItem, Category, Order, DashboardStats } from '@/core/db'

const STALE = {
  settings: 60_000,
  tables: 8_000,
  menu: 30_000,
  categories: 30_000,
  orders: 8_000,
  dashboard: 25_000,
  hq: 60_000,
}

export function useTenant() {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['tenant'],
    queryFn: async () => {
      const res = await tenantService.getTenant()
      if (res.error) throw new Error(res.error)
      return res.data as TenantResponse
    },
    staleTime: STALE.settings,
  })

  return { 
    tenant: data, 
    isLoading: isLoading && !data, 
    isError: !!error, 
    mutate: refetch 
  }
}

export function useTenantMutations() {
  const queryClient = useQueryClient()

  const updateTenant = useMutation({
    mutationFn: (payload: UpdateTenantRequest) => tenantService.updateTenant(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] })
    }
  })

  const uploadLogo = useMutation({
    mutationFn: (file: File) => tenantService.uploadLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] })
    }
  })

  return {
    updateTenant,
    uploadLogo
  }
}

export function useSettings() {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await tenantService.getSettings()
      if (res.error) throw new Error(res.error)
      return res.data as AppSettings
    },
    staleTime: STALE.settings,
    refetchInterval: STALE.settings,
  })

  return { 
    settings: data, 
    isLoading: isLoading && !data, 
    isError: !!error, 
    mutate: refetch 
  }
}

export function useTables() {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const res = await tenantService.getTables()
      if (res.error) throw new Error(res.error)
      return res.data as TableInfo[]
    },
    staleTime: 2000,
    refetchInterval: STALE.tables,
  })

  return { 
    tables: data ?? [], 
    isLoading: isLoading && !data, 
    isError: !!error, 
    mutate: refetch 
  }
}

export function useMenu() {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['menu'],
    queryFn: async () => {
      const res = await menuService.getMenuItems()
      if (res.error) throw new Error(res.error)
      return res.data as MenuItem[]
    },
    staleTime: STALE.menu,
    refetchInterval: STALE.menu,
  })

  return { 
    items: data ?? [], 
    isLoading: isLoading && !data, 
    isError: !!error, 
    mutate: refetch 
  }
}

export function useCategories() {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await menuService.getCategories()
      if (res.error) throw new Error(res.error)
      return res.data as Category[]
    },
    staleTime: STALE.categories,
    refetchInterval: STALE.categories,
  })

  return { 
    categories: data ?? [], 
    isLoading: isLoading && !data, 
    isError: !!error, 
    mutate: refetch 
  }
}

export function useOrders() {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await orderService.getOrders()
      if (res.error) throw new Error(res.error)
      return res.data as Order[]
    },
    staleTime: 3000,
    refetchInterval: STALE.orders,
  })

  return { 
    orders: data ?? [], 
    isLoading: isLoading && !data, 
    isError: !!error, 
    mutate: refetch 
  }
}

export function useCustomers() {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await fetch('/api/customers').then(r => r.json())
      return res as any[]
    },
    staleTime: STALE.hq,
  })

  return { 
    customers: data ?? [], 
    isLoading: isLoading && !data, 
    isError: !!error, 
    mutate: refetch 
  }
}

export function useDashboard() {
  const interval = typeof window !== 'undefined' 
    ? Number(process.env.NEXT_PUBLIC_REFRESH_INTERVAL) || STALE.dashboard
    : STALE.dashboard

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await tenantService.getDashboardStats()
      if (res.error) throw new Error(res.error)
      return res.data as DashboardStats
    },
    staleTime: interval,
    refetchInterval: interval,
  })

  return { 
    stats: data, 
    isLoading: isLoading && !data, 
    isError: !!error, 
    mutate: refetch 
  }
}

// POS Mutations with Optimistic Updates
export function usePOSMutations() {
  const queryClient = useQueryClient()

  const createOrder = useMutation({
    mutationFn: (payload: any) => orderService.createOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    }
  })

  const updateOrderStatus = useMutation({
    mutationFn: ({ id, status, paymentMethod, customerName, customerPhone }: { 
      id: number, 
      status: string, 
      paymentMethod?: string,
      customerName?: string,
      customerPhone?: string
    }) => 
      orderService.updateOrderStatus(id, { status: status as any, paymentMethod, customerName, customerPhone }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  })

  const addItems = useMutation({
    mutationFn: ({ id, items }: { id: number, items: any[] }) => 
      orderService.addOrderItems(id, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    }
  })

  return {
    createOrder,
    updateOrderStatus,
    addItems
  }
}

// HQ Hooks
export function useHqAnalytics() {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['hq-analytics'],
    queryFn: async () => {
      const res = await hqService.getAnalytics()
      if (res.error) throw new Error(res.error)
      return res.data
    },
    staleTime: STALE.hq,
  })

  return { 
    analytics: data, 
    isLoading, 
    isError: !!error, 
    mutate: refetch 
  }
}

export function useHqTenants() {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['hq-tenants'],
    queryFn: async () => {
      const res = await hqService.getTenants()
      if (res.error) throw new Error(res.error)
      return res.data
    },
    staleTime: STALE.hq,
  })

  return { 
    tenants: data ?? [], 
    isLoading, 
    isError: !!error, 
    mutate: refetch 
  }
}
