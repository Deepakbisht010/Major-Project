-- =========================================================================
-- E-TaxPay Database Synchronization Script
-- Run this in your Supabase SQL Editor to fix Table & Column mismatches
-- =========================================================================

-- 1. Fix GOVERNMENT_UPDATES Table
-- The old schema was missing 'district' and had restrictive CHECK constraints
DROP TABLE IF EXISTS public.government_updates CASCADE;

CREATE TABLE public.government_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'Notice', -- Handles 'Tax Update', 'Scheme', etc.
    district TEXT DEFAULT 'all',    -- Allows filtering by location
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.government_updates ENABLE ROW LEVEL SECURITY;

-- Policies for Government Updates
CREATE POLICY "Public read updates" ON public.government_updates FOR SELECT USING (true);
CREATE POLICY "Admins manage updates" ON public.government_updates FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE auth_id = auth.uid() 
        AND role_id IN (SELECT id FROM roles WHERE name IN ('super_admin', 'district_admin'))
    )
);

-- 2. Fix NOTICES Table
-- Ensuring columns match Controller expectations (month vs notice_month)
DROP TABLE IF EXISTS public.notices CASCADE;

CREATE TABLE public.notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    month TEXT, -- Standardized name
    year INTEGER,
    is_urgent BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Policies for Notices
CREATE POLICY "Users read own notices" ON public.notices FOR SELECT USING (auth.uid() IN (SELECT auth_id FROM users WHERE id = user_id));
CREATE POLICY "Admins manage notices" ON public.notices FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE auth_id = auth.uid() 
        AND role_id IN (SELECT id FROM roles WHERE name IN ('super_admin', 'district_admin'))
    )
);

-- 3. Ensure ROLES exist (required for policies)
INSERT INTO roles (id, name) VALUES (1, 'user'), (2, 'district_admin'), (3, 'super_admin') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO roles (id, name) VALUES (1, 'user'), (2, 'district_admin'), (3, 'super_admin') 
ON CONFLICT (name) DO NOTHING;
