-- Script to fix the customers table schema by adding the missing mobile_phone column

-- First, check if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customers') THEN
        -- Check if the mobile_phone column already exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'customers' 
            AND column_name = 'mobile_phone'
        ) THEN
            -- Add the mobile_phone column
            ALTER TABLE public.customers ADD COLUMN mobile_phone TEXT;
            RAISE NOTICE 'Added mobile_phone column to customers table';
        ELSE
            RAISE NOTICE 'mobile_phone column already exists in customers table';
        END IF;
        
        -- Check if the billing_address column already exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'customers' 
            AND column_name = 'billing_address'
        ) THEN
            -- Add the billing_address column
            ALTER TABLE public.customers ADD COLUMN billing_address JSONB;
            RAISE NOTICE 'Added billing_address column to customers table';
        ELSE
            RAISE NOTICE 'billing_address column already exists in customers table';
        END IF;
    ELSE
        RAISE NOTICE 'customers table does not exist';
    END IF;
END $$; 