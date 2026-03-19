-- Create business_pricing table (Requested in Step 1)
CREATE TABLE IF NOT EXISTS public.business_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_type TEXT UNIQUE NOT NULL,
    amount NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert Default Data (Requested in Step 2)
INSERT INTO public.business_pricing (business_type, amount)
VALUES 
    ('general', 2),
    ('medical', 1),
    ('clothing', 2),
    ('electronics', 3),
    ('restaurant', 3),
    ('hardware', 2),
    ('stationery', 1),
    ('other', 2),
    -- Keeping the pretty names as well for future proofing
    ('General Store', 2),
    ('Medical Store', 1),
    ('Clothing Store', 2),
    ('Electronics Shop', 3),
    ('Restaurant / Eatery', 3),
    ('Hardware Store', 2),
    ('Stationery Shop', 1),
    ('Other Type', 2)
ON CONFLICT (business_type) DO UPDATE SET amount = EXCLUDED.amount;

-- Enable RLS
ALTER TABLE public.business_pricing ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to view pricing
CREATE POLICY "Users can view business pricing"
    ON public.business_pricing FOR SELECT
    USING (true);
