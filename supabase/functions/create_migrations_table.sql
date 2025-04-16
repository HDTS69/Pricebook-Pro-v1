-- Function to create the migrations tracking table
CREATE OR REPLACE FUNCTION create_migrations_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS migrations (
    name TEXT PRIMARY KEY, 
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN DEFAULT TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 