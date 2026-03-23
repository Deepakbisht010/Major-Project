-- ============================================
-- E-TaxPay Database Schema for Supabase
-- Uttarakhand Zila Panchayat Shop Tax System
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ROLES TABLE
-- ============================================
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO roles (name, description) VALUES
  ('user', 'Regular shop owner'),
  ('district_admin', 'District level administrator'),
  ('super_admin', 'State level super administrator');

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(100) NOT NULL,
  gst_id VARCHAR(15) UNIQUE NOT NULL,
  mobile VARCHAR(15) NOT NULL,
  email VARCHAR(255),
  father_name VARCHAR(100),
  district VARCHAR(50) NOT NULL,
  block VARCHAR(100) NOT NULL,
  business_type VARCHAR(50) NOT NULL,
  shop_photo_url TEXT,
  user_photo_url TEXT,
  role_id INTEGER REFERENCES roles(id) DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_gst ON users(gst_id);
CREATE INDEX idx_users_district ON users(district);
CREATE INDEX idx_users_block ON users(block);
CREATE INDEX idx_users_business_type ON users(business_type);

-- ============================================
-- ADMINS TABLE
-- ============================================
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role_id INTEGER REFERENCES roles(id) DEFAULT 2,
  district VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  passkey_hash TEXT NOT NULL,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TAXES TABLE
-- ============================================
CREATE TABLE taxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  amount DECIMAL(10,2) NOT NULL DEFAULT 500.00,
  penalty DECIMAL(10,2) DEFAULT 0.00,
  total DECIMAL(10,2) GENERATED ALWAYS AS (amount + penalty) STORED,
  status VARCHAR(20) DEFAULT 'unpaid' CHECK (status IN ('paid','unpaid','overdue')),
  due_date DATE NOT NULL,
  paid_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year, month)
);

CREATE INDEX idx_taxes_user ON taxes(user_id);
CREATE INDEX idx_taxes_status ON taxes(status);
CREATE INDEX idx_taxes_year_month ON taxes(year, month);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tax_id UUID REFERENCES taxes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'online',
  payment_gateway VARCHAR(50) DEFAULT 'razorpay',
  gateway_response JSONB,
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success','failed','pending','refunded')),
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_transaction ON payments(transaction_id);

-- ============================================
-- NOTICES TABLE
-- ============================================
CREATE TABLE notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admins(id),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notice_month INTEGER,
  notice_year INTEGER,
  is_urgent BOOLEAN DEFAULT FALSE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notices_user ON notices(user_id);

-- ============================================
-- COMPLAINTS TABLE
-- ============================================
CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  shop_name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  reason VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  photo_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','verified','action_taken','rejected')),
  admin_notes TEXT,
  resolved_by UUID REFERENCES admins(id),
  resolved_at TIMESTAMPTZ,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_user ON complaints(user_id);

-- ============================================
-- GOVERNMENT UPDATES TABLE
-- ============================================
CREATE TABLE government_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES admins(id),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'notice' CHECK (category IN ('tax_update','scheme','notice','announcement')),
  is_published BOOLEAN DEFAULT TRUE,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  admin_id UUID,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ============================================
-- LOGIN ATTEMPTS TABLE
-- ============================================
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier VARCHAR(100) NOT NULL,
  attempt_type VARCHAR(20) DEFAULT 'user' CHECK (attempt_type IN ('user','admin')),
  success BOOLEAN DEFAULT FALSE,
  ip_address INET,
  user_agent TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_login_identifier ON login_attempts(identifier);
CREATE INDEX idx_login_time ON login_attempts(attempted_at);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info','warning','success','payment','notice')),
  is_read BOOLEAN DEFAULT FALSE,
  link VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users read own data" ON users
  FOR SELECT USING (auth.uid() = auth_id);

-- Users can update their own data
CREATE POLICY "Users update own data" ON users
  FOR UPDATE USING (auth.uid() = auth_id);

-- Users can read their own taxes
CREATE POLICY "Users read own taxes" ON taxes
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Users can read their own payments
CREATE POLICY "Users read own payments" ON payments
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Users can read their own notices
CREATE POLICY "Users read own notices" ON notices
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Users can insert complaints
CREATE POLICY "Users insert complaints" ON complaints
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Users can read their own complaints
CREATE POLICY "Users read own complaints" ON complaints
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Users can read their own notifications
CREATE POLICY "Users read own notifications" ON notifications
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Government updates are public
ALTER TABLE government_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read updates" ON government_updates
  FOR SELECT USING (is_published = TRUE);
