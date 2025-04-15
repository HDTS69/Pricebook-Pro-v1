# Pricebook Pro Database Setup

This guide will help you set up the necessary database schema for the Pricebook Pro application in Supabase.

## Prerequisites

- A Supabase account
- Access to the Supabase project created for Pricebook Pro

## Setting Up the Database

### Quick Setup (For Development/Testing)

1. Log in to your Supabase dashboard: https://app.supabase.com/
2. Select your project
3. Navigate to the **SQL Editor** tab
4. Click **New Query** to create a new query
5. Copy and paste the contents of the `setup-db.sql` file from this project
6. Click **Run** to execute the query and create the necessary tables and policies

> **Important Note**: The setup script includes a temporary open access policy for testing. In a production environment, you should use the more restrictive policies that are commented out in the script.

### Verifying the Setup

After running the setup script, you can verify that everything is working correctly:

1. Go to the **Table Editor** in your Supabase dashboard
2. You should see a `customers` table with the columns defined in the schema
3. Click on the `customers` table to verify that it has the correct columns:
   - id (UUID)
   - name (text)
   - email (text)
   - phone (text)
   - mobile_phone (text)
   - billing_address (jsonb)
   - created_at (timestamp with time zone)
   - updated_at (timestamp with time zone)

## Authentication

The application is designed to work with Supabase authentication, but for initial testing, you can skip this by using the temporary open access policy included in the setup script.

For proper authentication:

1. Navigate to the **Authentication** section in your Supabase dashboard
2. Set up email authentication or another authentication method
3. Create a test user
4. Update the `.env` file with your Supabase URL and anon key:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Common Errors and Troubleshooting

### "Could not find the 'billing_address' column of 'customers'"

This error occurs when the database schema hasn't been properly set up. To fix this:

1. Make sure you've run the `setup-db.sql` script in your Supabase project
2. Check that the `customers` table includes a `billing_address` column of type JSONB
3. If the column is missing, run the setup script again to recreate the table

### "User not authenticated"

This error appears in the console when you're not logged in. You can either:

1. Log in with a valid user account, or
2. Use the temporary open access policy included in the setup script for testing

### Other Database Errors

If you encounter other database errors:

1. Check the browser console for detailed error messages
2. Verify that your Supabase URL and anon key are correct in the `.env` file
3. Try dropping and recreating the tables using the setup script
4. Enable logging in Supabase to see more detailed error information 