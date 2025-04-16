import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config();

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function displayAndExecuteMigrations() {
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

    console.log(`Found ${files.length} SQL migration files.`);

    // Track completed migrations locally
    const completedMigrations = [];

    // Process each SQL file
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      console.log(`\nProcessing migration: ${file}`);
      
      // Skip already completed migrations in this session
      if (completedMigrations.includes(file)) {
        console.log(`Migration ${file} was already applied in this session. Skipping.`);
        continue;
      }
      
      // Read SQL content
      const sql = fs.readFileSync(filePath, 'utf8');
      
      console.log(`Migration SQL to be executed: ${file}`);
      console.log('-----------------------------------------------------------');
      console.log(sql);
      console.log('-----------------------------------------------------------');
      
      const response = await question('Have you applied this migration in Supabase SQL Editor? (yes/y) ');
      
      if (!isAffirmative(response)) {
        console.log('Migration process paused. Please apply the migration and run this script again.');
        console.log(`You have completed ${completedMigrations.length} migrations so far.`);
        rl.close();
        process.exit(0);
      }
      
      // Record the migration as completed locally
      completedMigrations.push(file);
      console.log(`Marked migration as completed: ${file}`);
    }

    console.log(`\nAll migrations displayed and marked as completed.`);
    console.log(`Total migrations processed: ${completedMigrations.length}`);
    rl.close();
  } catch (error) {
    console.error('Error processing migrations:', error);
    rl.close();
    process.exit(1);
  }
}

// Execute the function
displayAndExecuteMigrations(); 