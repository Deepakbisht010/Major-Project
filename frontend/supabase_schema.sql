-- e-taxpay Supabase Schema Initialization

-- 1. Create the 'profiles' table to hold extended user data
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'super_admin')),
    gst_id TEXT UNIQUE,
    username TEXT NOT NULL,
    mobile TEXT,
    district TEXT,
    block TEXT,
    business_type TEXT,
    father_name TEXT,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS) on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING ( auth.uid() = id );

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
    ON public.profiles FOR SELECT 
    USING ( 
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
        ) 
    );

-- Trigger to automatically create a profile entry when a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, role, gst_id)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', 'User_' || substr(NEW.id::text, 1, 6)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NEW.raw_user_meta_data->>'gst_id'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Create the 'taxes' table to track payments
CREATE TABLE public.taxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'pending')),
    month TEXT NOT NULL,
    year INTEGER NOT NULL,
    payment_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on taxes
ALTER TABLE public.taxes ENABLE ROW LEVEL SECURITY;

-- Taxes Policies
-- Users can view their own taxes
CREATE POLICY "Users can view own taxes" 
    ON public.taxes FOR SELECT 
    USING ( auth.uid() = user_id );

-- Users can insert their own taxes (initial creation)
CREATE POLICY "Users can insert own taxes" 
    ON public.taxes FOR INSERT 
    WITH CHECK ( auth.uid() = user_id );

-- Admins can view all taxes
CREATE POLICY "Admins can view all taxes" 
    ON public.taxes FOR SELECT 
    USING ( 
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
        ) 
    );

-- Admins can update all taxes
CREATE POLICY "Admins can update all taxes" 
    ON public.taxes FOR UPDATE 
    USING ( 
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
        ) 
    );
