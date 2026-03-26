-- SQL to create notices table
-- Required for the bulk notice generation system
CREATE TABLE IF NOT EXISTS public.notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'tax_reminder', -- 'tax_reminder', 'official', 'generic'
    urgent BOOLEAN DEFAULT FALSE,
    month TEXT,
    year INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    read BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Users can view their own notices
CREATE POLICY "Users can view their own notices" 
    ON public.notices FOR SELECT 
    USING ( auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id) );

-- Admins can insert notices for any user
CREATE POLICY "Admins can insert notices" 
    ON public.notices FOR INSERT 
    WITH CHECK ( 
        EXISTS (
            SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role_id IN (SELECT id FROM roles WHERE name IN ('super_admin', 'district_admin'))
        ) 
    );

-- Admins can view all notices
CREATE POLICY "Admins can view all notices" 
    ON public.notices FOR SELECT 
    USING ( 
        EXISTS (
            SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role_id IN (SELECT id FROM roles WHERE name IN ('super_admin', 'district_admin'))
        ) 
    );
