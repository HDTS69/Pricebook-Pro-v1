# Database Migrations for Pricebook Pro

This directory contains SQL migration files for the Pricebook Pro application's Supabase database.

## How to Apply Migrations

### Method 1: Using the Supabase Dashboard (Recommended)

1. Log in to your Supabase dashboard at [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Navigate to the SQL Editor
4. Create a new query
5. Copy and paste the contents of the migration file (e.g., `profiles_table.sql`)
6. Run the query

### Method 2: Using the Supabase CLI

If you have the Supabase CLI installed, you can apply migrations with:

```bash
supabase db push --db-url <your-db-url>
```

## Migration Files

- `profiles_table.sql`: Creates a profiles table to store user information with automatic synchronization from auth.users

## Important Notes

- These migrations include Row Level Security (RLS) policies to protect your data
- Triggers are set up to automatically sync user metadata with the profiles table
- Make sure to run these migrations in a development environment first before applying to production 