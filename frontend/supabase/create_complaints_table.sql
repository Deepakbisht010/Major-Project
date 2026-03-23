-- SQL to create complaints table if it's missing
-- This table is required for the 'Complaint' section in the citizen portal
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    shop_name TEXT NOT NULL,
    location TEXT NOT NULL,
    reason TEXT NOT NULL,
    description TEXT NOT NULL,
    photo_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'action_taken', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS) on complaints
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Policies for complaints
-- Users can insert their own complaints
CREATE POLICY "Users can insert their own complaints" 
    ON public.complaints FOR INSERT 
    WITH CHECK ( auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id) );

-- Users can view their own complaints
CREATE POLICY "Users can view their own complaints" 
    ON public.complaints FOR SELECT 
    USING ( auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id) );

-- Admins can view all complaints
CREATE POLICY "Admins can view all complaints" 
    ON public.complaints FOR SELECT 
    USING ( 
        EXISTS (
            SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role_id IN (SELECT id FROM roles WHERE name IN ('super_admin', 'district_admin'))
        ) 
    );

-- Admins can update all complaints
CREATE POLICY "Admins can update all complaints" 
    ON public.complaints FOR UPDATE 
    USING ( 
        EXISTS (
            SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role_id IN (SELECT id FROM roles WHERE name IN ('super_admin', 'district_admin'))
        ) 
    );
