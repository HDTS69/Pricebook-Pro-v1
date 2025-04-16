-- Function to execute arbitrary SQL
-- This should be created with appropriate permissions in Supabase
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$; 