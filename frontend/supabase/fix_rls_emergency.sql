-- Emergency RLS Fix for monthly_taxes
-- Allow all operations for now to unblock the user

ALTER TABLE public.monthly_taxes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rules DISABLE ROW LEVEL SECURITY;

-- Or if they want to keep it enabled, just add an "All allowed" policy
-- ALTER TABLE public.monthly_taxes ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Allow all for monthly_taxes" ON public.monthly_taxes;
-- CREATE POLICY "Allow all for monthly_taxes" ON public.monthly_taxes FOR ALL USING (true) WITH CHECK (true);
