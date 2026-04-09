-- SQL to create government_updates table 
CREATE TABLE IF NOT EXISTS public.government_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'Notice', -- 'Tax Update', 'Scheme', 'Notice', 'Announcement'
    district TEXT, -- Allows filtering by location (e.g., 'Almora' or 'all')
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.government_updates ENABLE ROW LEVEL SECURITY;

-- Everyone can view updates
CREATE POLICY "Public can view government updates" 
    ON public.government_updates FOR SELECT 
    USING ( true );

-- Admins can manage updates
CREATE POLICY "Admins can manage government updates" 
    ON public.government_updates FOR ALL
    USING ( 
        EXISTS (
            SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role_id IN (SELECT id FROM roles WHERE name IN ('super_admin', 'district_admin'))
        ) 
    );
