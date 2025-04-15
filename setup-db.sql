-- Add extension for UUID support if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing table if it exists (be careful with this in production!)
DROP TABLE IF EXISTS public.customers;

-- Create customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile_phone TEXT,
  billing_address JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create RLS policies for customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Allow public access for now to simplify testing
-- IMPORTANT: For production, use more restrictive policies
CREATE POLICY "Allow public access to customers" 
  ON public.customers 
  FOR ALL
  USING (true);

/* After testing, replace the above policy with these more restrictive ones:

-- Allow authenticated users to view all customers
CREATE POLICY "Allow authenticated users to view customers" 
  ON public.customers 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert customers
CREATE POLICY "Allow authenticated users to insert customers" 
  ON public.customers 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update their own customers
CREATE POLICY "Allow authenticated users to update customers" 
  ON public.customers 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete their own customers
CREATE POLICY "Allow authenticated users to delete customers" 
  ON public.customers 
  FOR DELETE 
  USING (auth.role() = 'authenticated');
*/ 