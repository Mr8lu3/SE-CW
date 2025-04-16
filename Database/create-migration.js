// Script to create a new database migration file
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// Ensure migrations directory exists
if (!fs.existsSync(MIGRATIONS_DIR)) {
  fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Get next migration number
function getNextMigrationNumber() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  if (files.length === 0) {
    return '001';
  }
  
  const lastFile = files[files.length - 1];
  const lastNumber = parseInt(lastFile.split('-')[0], 10);
  return String(lastNumber + 1).padStart(3, '0');
}

// Create a new migration file
function createMigration(description) {
  const number = getNextMigrationNumber();
  const fileName = `${number}-${description.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.sql`;
  const filePath = path.join(MIGRATIONS_DIR, fileName);
  
  const template = `-- Migration: ${description}
-- Created at: ${new Date().toISOString()}

-- Write your SQL statements here
-- Example:
-- CREATE TABLE new_table (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   name VARCHAR(100) NOT NULL
-- );

-- To roll back this migration, you would write:
-- DROP TABLE IF EXISTS new_table;
`;

  fs.writeFileSync(filePath, template);
  console.log(`Created new migration file: ${fileName}`);
  console.log(`Location: ${filePath}`);
  console.log('\nEdit this file to add your database changes, then commit it to your repository.');
}

// Ask for migration description
rl.question('Enter a brief description for this migration: ', (description) => {
  if (!description || description.trim() === '') {
    console.error('Error: Description cannot be empty');
    rl.close();
    return;
  }
  
  createMigration(description.trim());
  rl.close();
});