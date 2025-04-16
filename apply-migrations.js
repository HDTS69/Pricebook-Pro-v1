import dotenv from 'dotenv';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL or Service Key is missing');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Migrations to run in order
const migrations = [
  'migrations/create_company_settings_rpc.sql'
];

async function applyMigrations() {
  console.log('Starting migration process...');
  
  for (const migrationFile of migrations) {
    try {
      console.log(`Applying migration: ${migrationFile}`);
      const sql = fs.readFileSync(migrationFile, 'utf8');
      
      // Execute the SQL
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.error(`Error applying migration ${migrationFile}:`, error);
      } else {
        console.log(`Successfully applied migration: ${migrationFile}`);
      }
    } catch (error) {
      console.error(`Error processing migration ${migrationFile}:`, error);
    }
  }
  
  console.log('Migration process completed');
}

applyMigrations().catch(error => {
  console.error('Migration process failed:', error);
  process.exit(1);
}); 