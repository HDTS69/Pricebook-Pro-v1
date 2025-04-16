# Supabase Migrations

This directory contains SQL migrations for the Supabase project.

## Setup

1. Make sure your `.env` file contains the proper Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## Migration System Components

This migration system consists of:

1. `migrations/` - Directory containing numbered SQL migration files
2. `templates/` - Directory containing templates for new migrations
3. `apply-migrations-simple.js` - Script to apply migrations manually
4. `create-migration.js` - Script to create new migrations
5. `templates/examples.sql` - SQL examples for reference

## Creating Migrations

### Option 1: Use the Migration Generator (Recommended)

The easiest way to create a new migration is to use the provided script:

```bash
node supabase/create-migration.js
```

This will:
1. Ask for a migration name
2. Ask for a description
3. Automatically determine the next migration number
4. Create a properly named file with a template

### Option 2: Manual Creation

Alternatively, you can manually create migrations:

1. Create a new SQL file in the `migrations` directory.
2. Name the file with a prefix number for ordering (e.g., `01_create_users.sql`, `02_add_columns.sql`).
3. Write your SQL migration in the file.

## SQL Examples

For common SQL patterns, see `templates/examples.sql`, which includes examples for:

- Adding columns
- Creating indexes
- Adding comments
- Creating tables
- Adding foreign keys
- Creating and using enum types
- Adding check constraints
- Creating functions

## Running Migrations

You have two options for running migrations:

### Option 1: Simple Migration Display (Recommended)

This approach simply displays each migration and asks for confirmation without trying to track them in the database:

```bash
node supabase/apply-migrations-simple.js
```

The script will:
1. Display each SQL migration file one by one
2. Ask you to run it manually in the Supabase SQL Editor
3. Keep track of which migrations you've confirmed in the current session

This is the recommended approach as it doesn't require any database setup.

### Option 2: Database-Tracked Migrations

This approach attempts to track migrations in a `migrations` table:

```bash
node supabase/apply-migrations.js
```

However, this requires setting up a `migrations` table in your database first.

## Manual Application

Since executing arbitrary SQL is limited with the Supabase client, you'll need to:

1. Copy the SQL from the console output
2. Paste it into the Supabase SQL Editor
3. Run the SQL
4. Return to the terminal and confirm that you've applied the migration

This process ensures that all migrations are tracked and applied in order.

## Troubleshooting

If you encounter issues with the database-tracked migrations, try:

1. Creating the migrations table manually in the Supabase SQL Editor:
   ```sql
   CREATE TABLE IF NOT EXISTS migrations (
     name TEXT PRIMARY KEY, 
     applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     success BOOLEAN DEFAULT TRUE
   );
   ```

2. Use the simplified script instead (`apply-migrations-simple.js`) 