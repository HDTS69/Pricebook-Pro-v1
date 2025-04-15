-- Add extension for UUID support if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (be careful with this in production!)
DROP TABLE IF EXISTS public.quote_tasks CASCADE;
DROP TABLE IF EXISTS public.quote_adjustments CASCADE;
DROP TABLE IF EXISTS public.quotes CASCADE;
DROP VIEW IF EXISTS public.quote_details CASCADE;
DROP VIEW IF EXISTS public.customer_stats CASCADE;

-- Create quotes table
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_number TEXT NOT NULL,
  sequence_number INTEGER NOT NULL,
  name TEXT,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Draft',
  selected_tier_id UUID,
  total_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_status CHECK (status IN ('Draft', 'Sent', 'Accepted', 'Declined'))
);

-- Create quote_tasks table to store tasks within quotes
CREATE TABLE public.quote_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL,
  task_id UUID,
  original_service_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create quote_task_addons table for addons attached to quote tasks
CREATE TABLE public.quote_task_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_task_id UUID NOT NULL REFERENCES public.quote_tasks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create quote_adjustments table for discounts and surcharges
CREATE TABLE public.quote_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_adjustment_type CHECK (type IN ('fixed', 'percentage'))
);

-- Create RLS policies for quotes
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_task_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_adjustments ENABLE ROW LEVEL SECURITY;

-- Allow public access for now to simplify testing
-- IMPORTANT: For production, use more restrictive policies
CREATE POLICY "Allow public access to quotes" 
  ON public.quotes
  FOR ALL
  USING (true);

CREATE POLICY "Allow public access to quote_tasks" 
  ON public.quote_tasks
  FOR ALL
  USING (true);

CREATE POLICY "Allow public access to quote_task_addons" 
  ON public.quote_task_addons
  FOR ALL
  USING (true);

CREATE POLICY "Allow public access to quote_adjustments" 
  ON public.quote_adjustments
  FOR ALL
  USING (true);

-- Create view for quote details with properly named columns
CREATE OR REPLACE VIEW public.quote_details AS
SELECT 
  q.id AS "id",
  q.quote_number AS "quoteNumber",
  q.sequence_number AS "sequenceNumber",
  q.name AS "name",
  q.customer_id AS "customerId",
  c.name AS "customerName",
  q.status AS "status",
  q.selected_tier_id AS "selectedTierId",
  q.total_price AS "totalPrice",
  q.created_at AS "createdAt",
  q.updated_at AS "updatedAt",
  q.sent_at AS "sentAt",
  q.accepted_at AS "acceptedAt"
FROM 
  public.quotes q
  JOIN public.customers c ON q.customer_id = c.id;

-- Create view for customer statistics
CREATE OR REPLACE VIEW public.customer_stats AS
SELECT 
  c.id AS "customerId",
  c.name AS "customerName",
  COUNT(q.id) AS "totalQuotes",
  MAX(q.created_at) AS "lastQuoteDate"
FROM 
  public.customers c
  LEFT JOIN public.quotes q ON c.id = q.customer_id
GROUP BY 
  c.id, c.name;

-- Create view for tier tasks with addons
CREATE OR REPLACE VIEW public.quote_tasks_with_addons AS
SELECT 
  qt.id AS "id",
  qt.quote_id AS "quoteId",
  qt.tier_id AS "tierId",
  qt.task_id AS "taskId",
  qt.original_service_id AS "originalServiceId",
  qt.name AS "name",
  qt.description AS "description",
  qt.base_price AS "basePrice",
  qt.quantity AS "quantity",
  qt.category AS "category",
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', qta.id,
          'name', qta.name,
          'price', qta.price
        )
      )
      FROM public.quote_task_addons qta
      WHERE qta.quote_task_id = qt.id
    ),
    '[]'::jsonb
  ) AS "addons"
FROM 
  public.quote_tasks qt;

-- Trigger function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update timestamp triggers
CREATE TRIGGER update_quotes_timestamp
BEFORE UPDATE ON public.quotes
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_quote_tasks_timestamp
BEFORE UPDATE ON public.quote_tasks
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_quote_task_addons_timestamp
BEFORE UPDATE ON public.quote_task_addons
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_quote_adjustments_timestamp
BEFORE UPDATE ON public.quote_adjustments
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp(); 