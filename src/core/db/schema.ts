// ── SaaS Relational Schema Types (PostgreSQL) ────────────────────────────────

export interface DbCategory {
  id: number
  tenantId: string
  name: string
  createdAt?: string
  itemCount?: number
}

export interface DbCustomer {
  id: string // UUID
  tenantId: string
  name: string
  phone: string
  totalOrders: number
  totalSpent: number
  lastVisit: string
}

export interface DbMenuItem {
  id: number
  tenantId: string
  categoryId: number | null
  name: string
  price: number
  available: boolean
  createdAt?: string
  updatedAt?: string
  category?: { id: number; name: string }
}

export interface DbOrder {
  id: number
  tenantId: string
  tokenNumber: number
  tableNumber: number | null
  status: 'PENDING' | 'PAID' | 'UNPAID' | 'CANCELLED'
  customerName?: string
  customerPhone?: string
  subtotal: number
  tax: number
  total: number
  createdAt: string
  updatedAt: string
  paymentMethod: string | null
  pdfUrl?: string
  items?: DbOrderItem[]
}

export interface DbOrderItem {
  id: string // UUID
  tenantId: string
  orderId: number
  menuItemId: number | null
  name: string
  price: number
  quantity: number
  printedQuantity: number
}

// ── Multi-Tenancy Types ──────────────────────────────────────────────────

export interface DbTenantTheme {
  primary: string   // e.g. "#f37c22"
  accent: string    // e.g. "#ffffff"
  muted: string     // e.g. "#1e293b"
  font: string      // e.g. "Inter"
}

export interface DbTenantConfig {
  taxEnabled: boolean
  taxRate: number
  taxLabel: string
  currencySymbol: string
  currencyCode: string
  currencyLocale: string
  maxTables: number
  maxMenuItems: number
  timezone: string
  address?: string
  phone?: string
  tagline?: string
  gstin?: string
}

export interface DbTenant {
  id: string                    // UUID
  slug: string                  // e.g. "acme"
  name: string                  // e.g. "Acme Restaurant"
  logoUrl?: string | null
  theme: DbTenantTheme
  config: DbTenantConfig
  plan: 'free' | 'starter' | 'pro'
  planExpiresAt?: string | null
  suspended: boolean
  createdAt: string
  updatedAt: string
}

export interface DbUser {
  id: string                    // UUID
  tenantId: string
  email: string
  passwordHash: string
  name: string
  roles: string[]
  totpSecret?: string
  totpEnabled: boolean
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

// ── Audit Log ────────────────────────────────────────────────────────────

export interface DbAuditLog {
  id: string // UUID
  tenantId: string
  actorId?: string
  actorEmail?: string
  type: string
  targetId?: string
  payload?: any
  ipAddress?: string
  createdAt: string
}

// ── UI/Dashboard Helpers ────────────────────────────────────────────────────

export interface DbDashboardStats {
  todayRevenue: number
  monthlyRevenue: number
  cashRevenue: number
  onlineRevenue: number
  unpaidRevenue: number
  todayOrders: number
  monthlyOrders: number
  pendingOrders: number
  yesterdayRevenue: number
  avgOrderValue: number
  topItems: { name: string; qty: number; revenue: number }[]
  weeklyAvg: number[]
  hourlyRevenue?: Record<number, number>
  recentOrders: DbOrder[]
  unpaidOrders: DbOrder[]
  tables?: { total: number; occupied: number }
}

export interface DbTableInfo {
  number: number
  status: 'available' | 'occupied'
  order: {
    id: number
    tokenNumber: number
    total: number
    itemCount: number
    createdAt: string
  } | null
}
