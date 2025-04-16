-- Add an ID column as primary key to the customers table
-- This migration adds an auto-incrementing ID column to serve as the primary key

-- First, add the ID column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'id'
    ) THEN
        -- Add the id column
        ALTER TABLE customers ADD COLUMN id BIGSERIAL PRIMARY KEY;
        
        -- Update the RLS policies to use the new primary key
        ALTER POLICY "Authenticated users can read customers" ON public.customers USING (auth.uid() = user_id);
        ALTER POLICY "Users can insert their own customers" ON public.customers WITH CHECK (auth.uid() = user_id);
        ALTER POLICY "Users can update their own customers" ON public.customers USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
        ALTER POLICY "Users can delete their own customers" ON public.customers USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Re-create the constraints and indexes if needed
DO $$
BEGIN
    -- Make sure id is set as primary key
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'customers_pkey' AND contype = 'p'
    ) THEN
        ALTER TABLE customers ADD PRIMARY KEY (id);
    END IF;
END
$$; 