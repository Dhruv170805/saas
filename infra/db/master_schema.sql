-- 🛡️ NEXUS POS: Master SaaS Infrastructure Schema
-- Engineered for High Availability, Multi-Tenant Isolation, and Financial Integrity.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tenants: The Independent Entity Plane
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    plan VARCHAR(32) DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro')),
    plan_expires_at TIMESTAMPTZ,
    theme JSONB DEFAULT '{"primary": "#f37c22", "accent": "#fbbf24", "muted": "#1e293b"}'::JSONB,
    config JSONB DEFAULT '{"currencySymbol": "₹", "taxEnabled": true, "taxRate": 5}'::JSONB,
    suspended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Master Orders: Financial Data Plane (Consolidated)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    table_id VARCHAR(64),
    status VARCHAR(32) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PREPARING', 'SERVED', 'PAID', 'CANCELLED')),
    total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    items JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_status ON orders(status);

-- 3. SuperAdmins: The Platform Controllers
CREATE TABLE super_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(32) DEFAULT 'SUPPORT' CHECK (role IN ('OWNER', 'FINANCE', 'SUPPORT')),
    totp_secret TEXT,
    totp_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Subscription Plans: Global Tiers
CREATE TABLE plans (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    features JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Active Subscriptions: Multi-Tenant Lifecycle
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id VARCHAR(32) NOT NULL REFERENCES plans(id),
    status VARCHAR(32) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'GRACE_PERIOD', 'SUSPENDED')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id)
);

-- 6. Payment Requests: Manual Verification Queue
CREATE TABLE payment_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    plan_id VARCHAR(32) NOT NULL REFERENCES plans(id),
    amount DECIMAL(10, 2) NOT NULL,
    transaction_id VARCHAR(128) UNIQUE NOT NULL,
    status VARCHAR(32) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    notes TEXT,
    verified_by UUID REFERENCES super_admins(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SEED DATA ───────────────────────────────────────────────────────────────

-- 1. Default Tenant
INSERT INTO tenants (id, slug, name, plan) 
VALUES ('00000000-0000-0000-0000-000000000000', 'default', 'NEXUS Main Cluster', 'pro');

-- 2. Platform Owner (SuperAdmin)
-- Password: GOD_MODE_ACTIVE_2026 (bcrypt hash)
INSERT INTO super_admins (email, password_hash, name, role)
VALUES ('superadmin@nexus.com', '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgNI9A9bcP.J8L8hH0k8fWIDT9uW', 'Admin Controller', 'OWNER');

-- 3. Core Plans
INSERT INTO plans (id, name, price, features) VALUES 
('free', 'Free Tier', 0.00, '{"max_orders": 100}'),
('starter', 'Restaurant Starter', 999.00, '{"max_orders": 1000, "whatsapp": true}'),
('pro', 'Fine Dining Pro', 2499.00, '{"max_orders": 99999, "whatsapp": true, "kds": true}');

-- 4. Initial Subscription
INSERT INTO subscriptions (tenant_id, plan_id, current_period_end)
VALUES ('00000000-0000-0000-0000-000000000000', 'pro', NOW() + INTERVAL '1 year');
