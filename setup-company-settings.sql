-- Create company_settings table
CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Your Company',
  address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Set up row level security (RLS)
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
    -- Drop the select policy if it exists
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'company_settings' 
        AND policyname = 'Users can view own company settings'
    ) THEN
        DROP POLICY "Users can view own company settings" ON public.company_settings;
    END IF;
    
    -- Drop the update policy if it exists
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'company_settings' 
        AND policyname = 'Users can update own company settings'
    ) THEN
        DROP POLICY "Users can update own company settings" ON public.company_settings;
    END IF;
    
    -- Drop the insert policy if it exists
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'company_settings' 
        AND policyname = 'Users can insert own company settings'
    ) THEN
        DROP POLICY "Users can insert own company settings" ON public.company_settings;
    END IF;
END $$;

-- Create policies
-- Users can view their own company settings
CREATE POLICY "Users can view own company settings" 
  ON public.company_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can update their own company settings
CREATE POLICY "Users can update own company settings" 
  ON public.company_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can insert their own company settings
CREATE POLICY "Users can insert own company settings" 
  ON public.company_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create or replace trigger function to create company settings on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_company_settings() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.company_settings (
    user_id,
    name,
    address,
    phone,
    email,
    website
  )
  VALUES (
    NEW.id,
    'Your Company',
    '',
    '',
    '',
    ''
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger exists and create only if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created_company_settings'
    ) THEN
        CREATE TRIGGER on_auth_user_created_company_settings
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_company_settings();
    END IF;
END $$; 