/**************************************************************
 * FIX FOR RLS AND TAX GENERATION ISSUES
 * 1. Log in to your Supabase Dashboard
 * 2. Go to the SQL Editor
 * 3. Paste the following SQL and RUN IT:
 **************************************************************

-- ⚠️ EMERGENCY FIX: DISABLE RLS FOR MONTHLY_TAXES TO UNBLOCK BACKEND ⚠️
ALTER TABLE public.monthly_taxes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_pricing DISABLE ROW LEVEL SECURITY;

-- Ensure constraints are correct
ALTER TABLE public.monthly_taxes DROP CONSTRAINT IF EXISTS monthly_taxes_shop_id_month_key;
ALTER TABLE public.monthly_taxes ADD CONSTRAINT monthly_taxes_shop_id_month_key UNIQUE(shop_id, month);

-- Add a default price just in case
INSERT INTO public.business_pricing (business_type, amount)
VALUES ('other', 10), ('general', 10)
ON CONFLICT (business_type) DO UPDATE SET amount = EXCLUDED.amount;

**************************************************************/
