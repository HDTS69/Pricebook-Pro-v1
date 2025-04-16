import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories
const templatesDir = path.join(__dirname, 'templates');
const migrationsDir = path.join(__dirname, 'migrations');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ensure directories exist
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

// Promisify readline question
function question(text) {
  return new Promise((resolve) => {
    rl.question(text, resolve);
  });
}

// Get the next migration number based on existing files
function getNextMigrationNumber() {
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  if (files.length === 0) {
    return '01';
  }
  
  const lastFile = files[files.length - 1];
  const lastNumber = parseInt(lastFile.split('_')[0], 10);
  return String(lastNumber + 1).padStart(2, '0');
}

async function createMigration() {
  try {
    // Get the next migration number
    const nextNumber = getNextMigrationNumber();
    
    // Get migration name
    const name = await question('Enter migration name (e.g., add_user_column): ');
    
    if (!name || name.trim() === '') {
      console.error('Error: Migration name cannot be empty');
      rl.close();
      process.exit(1);
    }
    
    // Get description
    const description = await question('Enter migration description: ');
    
    // Create filename
    const fileName = `${nextNumber}_${name.trim().toLowerCase().replace(/\s+/g, '_')}.sql`;
    const filePath = path.join(migrationsDir, fileName);
    
    // Check if template exists
    const templatePath = path.join(templatesDir, 'migration.sql');
    if (!fs.existsSync(templatePath)) {
      console.error(`Template not found: ${templatePath}`);
      rl.close();
      process.exit(1);
    }
    
    // Read template
    let templateContent = fs.readFileSync(templatePath, 'utf8');
    
    // Replace placeholders
    templateContent = templateContent
      .replace('[MIGRATION_NAME]', name)
      .replace('[DESCRIPTION]', description);
    
    // Write new migration file
    fs.writeFileSync(filePath, templateContent);
    
    console.log(`Migration file created: ${filePath}`);
    rl.close();
  } catch (error) {
    console.error('Error creating migration:', error);
    rl.close();
    process.exit(1);
  }
}

// Run the function
createMigration(); 