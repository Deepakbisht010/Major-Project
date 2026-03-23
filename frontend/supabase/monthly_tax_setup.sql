-- 1. Create tax_rules table
CREATE TABLE IF NOT EXISTS public.tax_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_type TEXT UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Insert initial tax rules
INSERT INTO public.tax_rules (shop_type, amount)
VALUES 
    ('medical', 1.00),
    ('grocery', 2.00),
    ('clothing', 1.00),
    ('electronics', 2.00),
    ('restaurant', 1.50),
    ('general', 1.00)
ON CONFLICT (shop_type) DO UPDATE SET amount = EXCLUDED.amount;

-- 3. Create monthly_taxes table
CREATE TABLE IF NOT EXISTS public.monthly_taxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    month TEXT NOT NULL, -- format "YYYY-MM"
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('paid', 'pending')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(shop_id, month)
);

-- 4. Update payments table with necessary monthly tax fields
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS month TEXT,
ADD COLUMN IF NOT EXISTS payment_id TEXT;

-- 5. Enable RLS on monthly_taxes
ALTER TABLE public.monthly_taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rules ENABLE ROW LEVEL SECURITY;

-- 6. Unified Policies for monthly_taxes
-- SERVICE ROLE (Backend) - Should have full access
DROP POLICY IF EXISTS "Service role can do all" ON public.monthly_taxes;
CREATE POLICY "Service role can do all" 
    ON public.monthly_taxes FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- Authenticated Users (Frontend) - Can view and update their own data
DROP POLICY IF EXISTS "Users can view own monthly taxes" ON public.monthly_taxes;
CREATE POLICY "Users can view own monthly taxes" 
    ON public.monthly_taxes FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = monthly_taxes.shop_id AND auth_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own monthly taxes" ON public.monthly_taxes;
CREATE POLICY "Users can update own monthly taxes"
    ON public.monthly_taxes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = monthly_taxes.shop_id AND auth_id = auth.uid()
        )
    )
    WITH CHECK (true);

-- Explicit Insert Policy (Required for the backend even if using service_role sometimes)
DROP POLICY IF EXISTS "Allow inserts for all" ON public.monthly_taxes;
CREATE POLICY "Allow inserts for all"
    ON public.monthly_taxes FOR INSERT
    WITH CHECK (true);


-- Users can view tax rules
DROP POLICY IF EXISTS "All users can view tax rules" ON public.tax_rules;
CREATE POLICY "All users can view tax rules"
    ON public.tax_rules FOR SELECT
    USING (true);
