// Database Synchronization Script for Team Development
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const mysql = require('mysql2/promise');

// Configuration
const config = {
  host: process.env.MYSQL_HOST || 'db',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_ROOT_PASSWORD || 'password',
  database: process.env.MYSQL_DATABASE || 'Game-Tips-DB',
  port: process.env.DB_PORT || 3306,
};

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// Ensure migrations directory exists
if (!fs.existsSync(MIGRATIONS_DIR)) {
  fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
}

// Get the current schema version from database
async function getSchemaVersion(connection) {
  try {
    const [rows] = await connection.query('SELECT version FROM schema_versions ORDER BY id DESC LIMIT 1');
    return rows.length > 0 ? rows[0].version : 0;
  } catch (err) {
    // If table doesn't exist, create it
    if (err.code === 'ER_NO_SUCH_TABLE') {
      console.log('Creating schema_versions table...');
      await connection.query(`
        CREATE TABLE schema_versions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          version INT NOT NULL,
          description VARCHAR(255),
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      return 0;
    }
    throw err;
  }
}

// Update the schema version in database
async function updateSchemaVersion(connection, version, description) {
  await connection.query(
    'INSERT INTO schema_versions (version, description) VALUES (?, ?)',
    [version, description]
  );
  console.log(`Updated schema to version ${version}: ${description}`);
}

// Apply a migration file
async function applyMigration(connection, file, version) {
  const migrationPath = path.join(MIGRATIONS_DIR, file);
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  console.log(`Applying migration: ${file}`);
  
  try {
    await connection.query(sql);
    await updateSchemaVersion(connection, version, file);
    return true;
  } catch (err) {
    console.error(`Error applying migration ${file}:`, err);
    return false;
  }
}

// Main function to synchronize the database
async function syncDatabase() {
  console.log('Starting database synchronization...');
  
  let connection;
  
  try {
    // Connect to the database
    connection = await mysql.createConnection(config);
    console.log('Connected to database');
    
    // Get current schema version
    const currentVersion = await getSchemaVersion(connection);
    console.log(`Current schema version: ${currentVersion}`);
    
    // Get all migration files and sort them
    const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    // If no migrations exist and schema version is 0, create initial migration from existing schema
    if (migrationFiles.length === 0 && currentVersion === 0) {
      console.log('No migrations found. Creating initial migration from gamingtips.sql...');
      const initialSchema = fs.readFileSync(path.join(__dirname, 'gamingtips.sql'), 'utf8');
      fs.writeFileSync(path.join(MIGRATIONS_DIR, '001-initial-schema.sql'), initialSchema);
      
      await applyMigration(connection, '001-initial-schema.sql', 1);
      console.log('Initial migration completed.');
    } else {
      // Apply any new migrations
      for (let i = currentVersion; i < migrationFiles.length; i++) {
        const file = migrationFiles[i];
        const nextVersion = i + 1;
        
        const success = await applyMigration(connection, file, nextVersion);
        if (!success) {
          console.error(`Migration failed at version ${nextVersion}`);
          break;
        }
      }
    }
    
    console.log('Database synchronization complete!');
  } catch (err) {
    console.error('Error during database synchronization:', err);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Export for use in other files
module.exports = { syncDatabase };

// If this script is run directly, execute the sync function
if (require.main === module) {
  syncDatabase().catch(err => {
    console.error('Critical error in database synchronization:', err);
    process.exit(1);
  });
}