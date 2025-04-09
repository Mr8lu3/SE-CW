// models/usermodel.js
const db = require('../app/services/db');
let bcrypt;

try {
  bcrypt = require('bcrypt');
  console.log('Bcrypt loaded successfully');
} catch (error) {
  console.error('Error loading bcrypt:', error.message);
  // Create a simple fallback if bcrypt is missing
  bcrypt = {
    hash: async (password, rounds) => password,
    compare: async (password, hash) => password === hash,
  };
  console.log('Using fallback password handling (INSECURE) - please install bcrypt');
}

// Create users table if it doesn't exist
async function initializeUserTable() {
  try {
    console.log('Attempting to initialize user table...');
    
    // First check if table exists
    const tableExistsQuery = `
      SELECT COUNT(*) as tableExists 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'users'
    `;
    
    const tableExists = await db.query(tableExistsQuery);
    
    // If table doesn't exist, create it
    if (tableExists[0].tableExists === 0) {
      console.log('Users table does not exist, creating it...');
      
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          email VARCHAR(100),
          role_id INT DEFAULT 2,
          is_admin BOOLEAN DEFAULT false,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `;
      
      await db.query(createTableQuery);
      console.log('Users table created');
    } else {
      console.log('Users table already exists, checking structure...');
      
      // Check if the table has password column or password_hash column
      const passwordColumnQuery = `
        SELECT COLUMN_NAME
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND (COLUMN_NAME = 'password' OR COLUMN_NAME = 'password_hash')
      `;
      
      const passwordColumns = await db.query(passwordColumnQuery);
      
      // Store which password column we have for later use
      let passwordColumnName = null;
      if (passwordColumns.length > 0) {
        passwordColumnName = passwordColumns[0].COLUMN_NAME;
        console.log(`Using existing password column: ${passwordColumnName}`);
      } else {
        console.log('No password column found, adding password_hash column...');
        await db.query('ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT "temp_password"');
        passwordColumnName = 'password_hash';
        console.log('password_hash column added');
      }
      
      // Check if the 'is_admin' column exists
      const adminColumnQuery = `
        SELECT COUNT(*) as columnExists
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND column_name = 'is_admin'
      `;
      
      const adminColumnExists = await db.query(adminColumnQuery);
      
      if (adminColumnExists[0].columnExists === 0) {
        console.log('is_admin column is missing, adding it...');
        await db.query('ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false');
        console.log('is_admin column added');
      }
      
      // Check if the 'role_id' column exists
      const roleColumnQuery = `
        SELECT COUNT(*) as columnExists
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND column_name = 'role_id'
      `;
      
      const roleColumnExists = await db.query(roleColumnQuery);
      
      // Check if admin user exists
      const adminCheck = await db.query('SELECT COUNT(*) as count FROM users WHERE username = ?', ['admin']);
      
      if (adminCheck[0].count === 0) {
        // Create admin user if it doesn't exist
        console.log('Creating admin user...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        // Use the correct column name for password and include role_id
        const insertQuery = `INSERT INTO users (username, ${passwordColumnName}, email, role_id, is_admin) VALUES (?, ?, ?, ?, ?)`;
        await db.query(insertQuery, ['admin', hashedPassword, 'admin@gamingtips.com', 1, true]);
        console.log('Admin user created successfully');
      } else {
        console.log('Admin user already exists');
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing user table:', error);
    throw error;
  }
}

// Get user by username
async function getUserByUsername(username) {
  try {
    const query = 'SELECT * FROM users WHERE username = ?';
    const users = await db.query(query, [username]);
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Error getting user by username:', error);
    throw error;
  }
}

// Get user by ID
async function getUserById(id) {
  try {
    const query = 'SELECT * FROM users WHERE id = ?';
    const users = await db.query(query, [id]);
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

// Create new user
async function createUser(username, password, email) {
  try {
    // Check if the table has password column or password_hash column
    const passwordColumnQuery = `
      SELECT COLUMN_NAME
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND (COLUMN_NAME = 'password' OR COLUMN_NAME = 'password_hash')
    `;
    
    const passwordColumns = await db.query(passwordColumnQuery);
    const passwordColumnName = passwordColumns.length > 0 ? passwordColumns[0].COLUMN_NAME : 'password_hash';
    
    const hashedPassword = await bcrypt.hash(password, 10);
    // Include role_id in the insert query
    const query = `INSERT INTO users (username, ${passwordColumnName}, email, role_id) VALUES (?, ?, ?, ?)`;
    const result = await db.query(query, [username, hashedPassword, email, 2]);  // Default role_id=2 for regular users
    return result.insertId;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

// Verify user credentials
async function verifyUser(username, password) {
  try {
    const user = await getUserByUsername(username);
    if (!user) {
      return null;
    }
    
    // Check which password field the user record has
    const passwordField = user.password_hash ? 'password_hash' : 'password';
    
    const passwordMatch = await bcrypt.compare(password, user[passwordField]);
    if (passwordMatch) {
      // Don't return the password
      const { password, password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    
    return null;
  } catch (error) {
    console.error('Error verifying user:', error);
    throw error;
  }
}

module.exports = {
  initializeUserTable,
  getUserByUsername,
  getUserById,
  createUser,
  verifyUser
};