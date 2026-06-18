-- Handmade Marketplace schema (PostgreSQL)

CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  role          TEXT NOT NULL CHECK (role IN ('BUYER','SELLER','ADMIN')),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS seller_profiles (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  shop_name   TEXT NOT NULL,
  description TEXT,
  avatar_url  TEXT
);

CREATE TABLE IF NOT EXISTS categories (
  id    BIGSERIAL PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS products (
  id          BIGSERIAL PRIMARY KEY,
  seller_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  currency    TEXT NOT NULL DEFAULT 'RUB',
  status      TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DISABLED')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_images (
  id         BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id          BIGSERIAL PRIMARY KEY,
  buyer_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status      TEXT NOT NULL DEFAULT 'CREATED'
              CHECK (status IN ('CREATED','PAID','SHIPPED','DELIVERED','CANCELED')),
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id          BIGSERIAL PRIMARY KEY,
  order_id    BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  qty         INT NOT NULL CHECK (qty > 0),
  unit_price  NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0)
);

CREATE TABLE IF NOT EXISTS payments (
  id              BIGSERIAL PRIMARY KEY,
  order_id        BIGINT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL DEFAULT 'demo',
  payment_status  TEXT NOT NULL DEFAULT 'PENDING'
                 CHECK (payment_status IN ('PENDING','PAID','FAILED')),
  amount          NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);

-- ============================================
-- ADMIN PANEL EXTENSIONS
-- ============================================

-- Блокировка пользователей (без удаления)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false;

-- Расширим статусы товаров для модерации
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE products ADD CONSTRAINT products_status_check CHECK (status IN ('PENDING','ACTIVE','DISABLED','REJECTED'));

-- Заявки от претендентов на продавца
CREATE TABLE IF NOT EXISTS seller_applications (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  shop_name   TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  rejection_reason TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seller_applications_status ON seller_applications(status);

-- Лог действий админа (для аудита)
CREATE TABLE IF NOT EXISTS admin_logs (
  id          BIGSERIAL PRIMARY KEY,
  admin_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   BIGINT,
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at DESC);

