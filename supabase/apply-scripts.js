// Script to apply our SQL migrations to Supabase using the REST API
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the project root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('Missing Supabase URL. Please check your .env file.');
  process.exit(1);
}

if (!supabaseAnonKey && !supabaseServiceRoleKey) {
  console.error('Missing both Supabase anon key and service role key. Please check your .env file.');
  process.exit(1);
}

// Initialize Supabase client with service role key if available, otherwise use anon key
const apiKey = supabaseServiceRoleKey || supabaseAnonKey;
console.log('Using Supabase URL:', supabaseUrl);
console.log('Using Service Role Key:', supabaseServiceRoleKey ? 'Yes' : 'No');

const supabase = createClient(supabaseUrl, apiKey);

async function applySqlFile(filePath) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      const rootPath = path.resolve(__dirname, '..', filePath);
      if (fs.existsSync(rootPath)) {
        filePath = rootPath;
      } else {
        console.error(`File not found: ${filePath}`);
        return false;
      }
    }
    
    console.log(`Reading SQL file: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`Applying SQL from ${filePath}...`);
    
    // Show the first part of the SQL for reference
    console.log('SQL to execute (preview):');
    console.log(sql.substring(0, 200) + '...');
    
    if (!supabaseServiceRoleKey) {
      console.log('NOTE: To actually execute this SQL, you need to:');
      console.log('1. Run this SQL in the Supabase dashboard SQL editor');
      console.log('2. Or set up the VITE_SUPABASE_SERVICE_ROLE_KEY in your .env file');
      
      // Test basic connectivity
      try {
        const { data, error } = await supabase.from('profiles').select('id').limit(1);
        
        if (error) {
          console.error(`Error testing Supabase connection:`, error);
          return false;
        }
        
        console.log('Supabase connection successful.');
        console.log('SQL file parsed successfully, but not executed.');
      } catch (error) {
        console.error('Error connecting to Supabase:', error);
        return false;
      }
    } else {
      // Execute the SQL directly using supabase REST API
      try {
        console.log('Executing SQL with service role key...');
        
        // Manual SQL execution with service role key
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceRoleKey,
            'Authorization': `Bearer ${supabaseServiceRoleKey}`
          },
          body: JSON.stringify({
            query: sql
          })
        });
        
        if (!response.ok) {
          let errorText;
          try {
            const errorJson = await response.json();
            errorText = JSON.stringify(errorJson);
          } catch (e) {
            errorText = await response.text();
          }
          console.error(`Error executing SQL: ${errorText}`);
          console.error(`Status: ${response.status} ${response.statusText}`);
          console.error('You might need to run this SQL manually in the Supabase SQL Editor.');
          return false;
        }
        
        const result = await response.json();
        console.log(`SQL executed successfully!`);
        console.log(`Result:`, result);
      } catch (error) {
        console.error('Error executing SQL:', error);
        console.error('You might need to run this SQL manually in the Supabase SQL Editor.');
        return false;
      }
    }
    
    return true;
  } catch (err) {
    console.error(`Error processing file ${filePath}:`, err);
    return false;
  }
}

// Main function
async function main() {
  if (process.argv.length < 3) {
    console.log('Usage: node apply-scripts.js <sql-file-path>');
    process.exit(1);
  }
  
  const filePath = process.argv[2];
  const success = await applySqlFile(filePath);
  
  if (success) {
    console.log('SQL script processed successfully.');
  } else {
    console.error('Failed to process SQL script.');
    process.exit(1);
  }
}

main(); 