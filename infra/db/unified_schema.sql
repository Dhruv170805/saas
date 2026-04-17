
-- 🛡️ NEXUS POS: Unified Multi-Tenant SaaS Schema
-- Merged Core POS + SuperAdmin Management Planes

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tenants
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    plan VARCHAR(32) DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro')),
    theme JSONB DEFAULT '{"primary": "#f37c22", "accent": "#ffffff", "font": "Inter"}'::JSONB,
    config JSONB DEFAULT '{"currencySymbol": "₹", "taxEnabled": true, "taxRate": 5}'::JSONB,
    suspended BOOLEAN DEFAULT FALSE,
    plan_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tenants_slug ON tenants(slug);

-- 2. Users (Global identity)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    totp_secret TEXT,
    totp_enabled BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User-Tenants (Many-to-Many Membership)
CREATE TABLE user_tenants (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    roles VARCHAR(32)[] DEFAULT '{cashier}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, tenant_id)
);
CREATE INDEX idx_user_tenants_tenant ON user_tenants(tenant_id);

-- 4. POS Plane: Categories
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_categories_tenant ON categories(tenant_id);

-- 5. POS Plane: Menu Items
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_menu_items_tenant ON menu_items(tenant_id);

-- 6. POS Plane: Orders
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    token_number INTEGER NOT NULL,
    table_number INTEGER,
    status VARCHAR(32) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'UNPAID', 'CANCELLED')),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(32),
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tax DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(32),
    pdf_url TEXT,
    reminder_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_orders_tenant_status ON orders(tenant_id, status);

-- 7. POS Plane: Order Items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    printed_quantity INTEGER DEFAULT 0
);

-- 8. CRM: Customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    total_orders INTEGER DEFAULT 1,
    total_spent DECIMAL(10, 2) DEFAULT 0.00,
    last_visit TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, phone)
);

-- 9. Infrastructure: Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_email VARCHAR(255),
    type VARCHAR(64) NOT NULL,
    target_id VARCHAR(128),
    payload JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Infrastructure: Refresh Tokens
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    device_id VARCHAR(128),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. SuperAdmin Plane: Plans
CREATE TABLE plans (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    features JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. SuperAdmin Plane: Subscriptions
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

-- 13. SuperAdmin Plane: Payment Requests
CREATE TABLE payment_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    plan_id VARCHAR(32) NOT NULL REFERENCES plans(id),
    amount DECIMAL(10, 2) NOT NULL,
    transaction_id VARCHAR(128) UNIQUE NOT NULL,
    status VARCHAR(32) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    notes TEXT,
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. RBAC Plane
CREATE TABLE permissions (
    id VARCHAR(64) PRIMARY KEY,
    description TEXT
);

CREATE TABLE role_permissions (
    role VARCHAR(32) NOT NULL,
    permission_id VARCHAR(64) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role, permission_id)
);

-- ── 🛡️ ROW LEVEL SECURITY ──────────────────────────────────────────────────

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON categories FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_isolation_policy ON menu_items FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_isolation_policy ON orders FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_isolation_policy ON order_items FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_isolation_policy ON customers FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_isolation_policy ON audit_logs FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY user_tenant_isolation_policy ON user_tenants FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID OR user_id = current_setting('app.current_user_id', true)::UUID);
CREATE POLICY refresh_tokens_isolation_policy ON refresh_tokens FOR ALL USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- ── 🏗️ SEED DATA ─────────────────────────────────────────────────────────────

INSERT INTO plans (id, name, price, features) VALUES 
('free', 'Free Tier', 0.00, '{"max_orders": 100}'),
('starter', 'Restaurant Starter', 999.00, '{"max_orders": 1000, "whatsapp": true}'),
('pro', 'Fine Dining Pro', 2499.00, '{"max_orders": 99999, "whatsapp": true, "kds": true}');

INSERT INTO permissions (id, description) VALUES
('manage_menu', 'Can create, edit and delete menu items'),
('manage_orders', 'Can process and cancel orders'),
('view_analytics', 'Can view revenue and growth metrics'),
('manage_staff', 'Can invite and manage tenant users'),
('manage_billing', 'Can manage subscriptions and payments'),
('system_admin', 'Full platform control');

INSERT INTO role_permissions (role, permission_id) VALUES
('admin', 'manage_menu'), ('admin', 'manage_orders'), ('admin', 'view_analytics'), ('admin', 'manage_staff'), ('admin', 'manage_billing'),
('cashier', 'manage_orders'),
('superadmin', 'manage_menu'), ('superadmin', 'manage_orders'), ('superadmin', 'view_analytics'), ('superadmin', 'manage_staff'), ('superadmin', 'manage_billing'), ('superadmin', 'system_admin');
