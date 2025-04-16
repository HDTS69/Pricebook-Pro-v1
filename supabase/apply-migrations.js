import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

// Load environment variables
dotenv.config();

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up Supabase client with service role
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase URL or service role key in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Define the directory containing SQL migration files
const migrationsDir = path.join(__dirname, 'migrations');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
function question(text) {
  return new Promise((resolve) => {
    rl.question(text, resolve);
  });
}

// Check if answer is affirmative (yes/y)
function isAffirmative(answer) {
  const lowerAnswer = answer.toLowerCase().trim();
  return lowerAnswer === 'yes' || lowerAnswer === 'y';
}

async function createMigrationsTable() {
  console.log('Migrations table does not exist. Creating it...');
  console.log('Please run the following SQL in your Supabase SQL Editor:');
  console.log('-----------------------------------------------------------');
  console.log(`
    CREATE TABLE IF NOT EXISTS migrations (
      name TEXT PRIMARY KEY, 
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      success BOOLEAN DEFAULT TRUE
    );
  `);
  console.log('-----------------------------------------------------------');
  
  const response = await question('Have you created the migrations table? (yes/y) ');
  
  if (!isAffirmative(response)) {
    console.log('Migration process aborted. Please create the migrations table and run this script again.');
    rl.close();
    process.exit(0);
  }
}

async function checkMigrationExists(file) {
  try {
    const { data, error } = await supabase
      .from('migrations')
      .select('name')
      .eq('name', file)
      .maybeSingle();
    
    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist
        await createMigrationsTable();
        return false;
      }
      throw error;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error checking migration status:', error);
    throw error;
  }
}

async function recordMigration(file) {
  try {
    // Log the attempt
    console.log(`Recording migration ${file} in the migrations table...`);
    
    const { data, error } = await supabase
      .from('migrations')
      .insert([{ name: file }])
      .select();
      
    if (error) {
      console.error(`Error details from Supabase when recording migration: ${JSON.stringify(error)}`);
      throw error;
    }
    
    console.log(`Migration recorded successfully: ${JSON.stringify(data)}`);
    return data;
  } catch (error) {
    console.error(`Error recording migration in database: ${error.message || JSON.stringify(error)}`);
    throw error;
  }
}

async function applySQLMigrations() {
  try {
    // Ensure the migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      console.error(`Migrations directory not found: ${migrationsDir}`);
      process.exit(1);
    }

    // Get a list of SQL files in the migrations directory
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ensure files are processed in alphabetical order

    if (files.length === 0) {
      console.log('No SQL migration files found.');
      rl.close();
      return;
    }

    console.log(`Found ${files.length} SQL migration files to apply.`);

    // Process each SQL file
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      console.log(`Processing migration: ${file}`);
      
      try {
        // Check if migration was already applied
        const migrationExists = await checkMigrationExists(file);
        
        if (migrationExists) {
          console.log(`Migration ${file} was already applied. Skipping.`);
          continue;
        }
        
        // Read SQL content
        const sql = fs.readFileSync(filePath, 'utf8');
        
        console.log(`Migration needs to be applied: ${file}`);
        console.log('Please run the following SQL in your Supabase SQL Editor:');
        console.log('-----------------------------------------------------------');
        console.log(sql);
        console.log('-----------------------------------------------------------');
        
        const response = await question('Have you applied this migration? (yes/y) ');
        
        if (!isAffirmative(response)) {
          console.log('Migration process aborted. Please apply the migration and run this script again.');
          rl.close();
          process.exit(0);
        }
        
        // Record the migration as applied
        await recordMigration(file);
        console.log(`Successfully recorded migration: ${file}`);
      } catch (error) {
        console.error(`Error with migration ${file}:`, error);
        rl.close();
        process.exit(1);
      }
    }

    console.log('All migrations handled successfully.');
    rl.close();
  } catch (error) {
    console.error('Error applying migrations:', error);
    rl.close();
    process.exit(1);
  }
}

// Execute the function
applySQLMigrations(); 