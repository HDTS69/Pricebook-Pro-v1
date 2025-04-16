-- SQL MIGRATION EXAMPLES

-- Add a column to a table
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name data_type;

-- Create an index
CREATE INDEX IF NOT EXISTS index_name ON table_name(column_name);

-- Add a comment to a column
COMMENT ON COLUMN table_name.column_name IS 'This is a comment';

-- Create a new table
CREATE TABLE IF NOT EXISTS table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  column_name data_type constraints
);

-- Add a foreign key
ALTER TABLE table_name ADD CONSTRAINT constraint_name
  FOREIGN KEY (column_name) REFERENCES referenced_table(referenced_column)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Create an enum type
CREATE TYPE status_enum AS ENUM ('draft', 'sent', 'accepted', 'rejected');

-- Use an enum
ALTER TABLE table_name ADD COLUMN status status_enum DEFAULT 'draft';

-- Add a check constraint
ALTER TABLE table_name ADD CONSTRAINT constraint_name 
  CHECK (column_name > 0);

-- Create a function
CREATE OR REPLACE FUNCTION function_name()
RETURNS return_type AS $$
BEGIN
  -- Function body
  RETURN result;
END;
$$ LANGUAGE plpgsql; 