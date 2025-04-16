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
          favorite_games TEXT,
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
      
      // Check if the 'favorite_games' column exists
      const favoriteGamesColumnQuery = `
        SELECT COUNT(*) as columnExists
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND column_name = 'favorite_games'
      `;
      
      const favoriteGamesColumnExists = await db.query(favoriteGamesColumnQuery);
      
      if (favoriteGamesColumnExists[0].columnExists === 0) {
        console.log('favorite_games column is missing, adding it...');
        await db.query('ALTER TABLE users ADD COLUMN favorite_games TEXT');
        console.log('favorite_games column added');
      }
      
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

// Get user by email
async function getUserByEmail(email) {
  try {
    const query = 'SELECT * FROM users WHERE email = ?';
    const users = await db.query(query, [email]);
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
}

// Get user by ID
async function getUserById(id) {
  try {
    // Guard against undefined id
    if (id === undefined) {
      console.error('getUserById called with undefined id');
      return null;
    }
    
    // Check if we should use 'id' or 'user_id' (for schema compatibility)
    const idColumnQuery = `
      SELECT COLUMN_NAME
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND (COLUMN_NAME = 'id' OR COLUMN_NAME = 'user_id')
      AND COLUMN_KEY = 'PRI'
    `;
    
    const idColumns = await db.query(idColumnQuery);
    const idColumnName = idColumns.length > 0 ? idColumns[0].COLUMN_NAME : 'id';
    
    const query = `SELECT * FROM users WHERE ${idColumnName} = ?`;
    console.log(`Executing getUserById with query: ${query} and id: ${id}`);
    
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
    console.log(`Attempting to create user with username: ${username}, email: ${email}`);
    
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user_id is auto-increment
    const autoIncrementQuery = `
      SELECT EXTRA 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'user_id' 
      AND EXTRA LIKE '%auto_increment%'
    `;
    
    const autoIncrementResult = await db.query(autoIncrementQuery);
    const isAutoIncrement = autoIncrementResult.length > 0;
    
    // Use password_hash column directly and check if role_id exists
    const roleColumnQuery = `
      SELECT COUNT(*) as columnExists
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND column_name = 'role_id'
    `;
    
    const roleColumnExists = await db.query(roleColumnQuery);
    
    let query;
    let params;
    
    if (isAutoIncrement) {
      // If user_id is auto-increment, don't specify it in the insert
      if (roleColumnExists[0].columnExists > 0) {
        query = `INSERT INTO users (username, password_hash, email, role_id) VALUES (?, ?, ?, ?)`;
        params = [username, hashedPassword, email, 2]; // Default role_id=2 for regular users
      } else {
        query = `INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)`;
        params = [username, hashedPassword, email];
      }
    } else {
      // If user_id is not auto-increment, we need to generate a new ID
      // Get the max user_id
      const maxIdQuery = `SELECT MAX(user_id) as max_id FROM users`;
      const maxIdResult = await db.query(maxIdQuery);
      const newId = (maxIdResult[0].max_id || 0) + 1;
      
      if (roleColumnExists[0].columnExists > 0) {
        query = `INSERT INTO users (user_id, username, password_hash, email, role_id) VALUES (?, ?, ?, ?, ?)`;
        params = [newId, username, hashedPassword, email, 2];
      } else {
        query = `INSERT INTO users (user_id, username, password_hash, email) VALUES (?, ?, ?, ?)`;
        params = [newId, username, hashedPassword, email];
      }
    }
    
    console.log(`Executing query: ${query}`);
    console.log('With values:', params.map(p => typeof p === 'string' ? p === hashedPassword ? '[HASHED PASSWORD]' : p : p));
    
    const result = await db.query(query, params);
    
    console.log('User creation result:', result);
    
    if (result && result.insertId) {
      console.log(`User created successfully with ID: ${result.insertId}`);
      return result.insertId;
    } else if (result && !isAutoIncrement) {
      // If user_id is not auto-increment, the insertId might not be set
      // Return the manually generated ID
      const newUser = await getUserByUsername(username);
      if (newUser) {
        return newUser.user_id;
      }
    }
    
    console.error('User creation failed - no insertId returned');
    throw new Error('Failed to create user - database did not return an ID');
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

// Verify user credentials - supports login with either username or email
async function verifyUser(usernameOrEmail, password) {
  try {
    // First try to find the user by username
    let user = await getUserByUsername(usernameOrEmail);
    
    // If not found, try by email
    if (!user) {
      user = await getUserByEmail(usernameOrEmail);
    }
    
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

// Update a user's profile
async function updateUser(userId, updateData) {
  try {
    console.log(`Attempting to update user with ID: ${userId}`);
    console.log('Update data:', Object.keys(updateData).reduce((acc, key) => {
      acc[key] = key === 'password' ? '[REDACTED]' : updateData[key];
      return acc;
    }, {}));
    
    // Check if we should use 'id' or 'user_id' (for schema compatibility)
    const idColumnQuery = `
      SELECT COLUMN_NAME
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND (COLUMN_NAME = 'id' OR COLUMN_NAME = 'user_id')
      AND COLUMN_KEY = 'PRI'
    `;
    
    const idColumns = await db.query(idColumnQuery);
    const idColumnName = idColumns.length > 0 ? idColumns[0].COLUMN_NAME : 'id';
    
    // Check if favorite_games column exists
    const favoriteGamesColumnQuery = `
      SELECT COUNT(*) as columnExists
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND column_name = 'favorite_games'
    `;
    
    const favoriteGamesColumnExists = await db.query(favoriteGamesColumnQuery);
    
    // Add the favorite_games column if it doesn't exist
    if (favoriteGamesColumnExists[0].columnExists === 0) {
      console.log('favorite_games column is missing, adding it...');
      await db.query('ALTER TABLE users ADD COLUMN favorite_games TEXT');
      console.log('favorite_games column added');
    }
    
    // Build the SQL update statement dynamically
    const setStatements = [];
    const values = [];
    
    // Handle special case for password
    if (updateData.password) {
      const hashedPassword = await bcrypt.hash(updateData.password, 10);
      
      // Check which password field the user record has
      const passwordColumnQuery = `
        SELECT COLUMN_NAME
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND (COLUMN_NAME = 'password' OR COLUMN_NAME = 'password_hash')
      `;
      
      const passwordColumns = await db.query(passwordColumnQuery);
      const passwordColumnName = passwordColumns.length > 0 ? passwordColumns[0].COLUMN_NAME : 'password_hash';
      
      setStatements.push(`${passwordColumnName} = ?`);
      values.push(hashedPassword);
      delete updateData.password;
    }
    
    // Handle all other fields
    for (const [key, value] of Object.entries(updateData)) {
      setStatements.push(`${key} = ?`);
      values.push(value);
    }
    
    // Finalize the query with WHERE condition
    values.push(userId);
    const updateQuery = `UPDATE users SET ${setStatements.join(', ')} WHERE ${idColumnName} = ?`;
    
    console.log(`Executing update query: ${updateQuery}`);
    
    const result = await db.query(updateQuery, values);
    console.log('Update result:', result);
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

// Verify a user's password
async function verifyPassword(username, password) {
  try {
    const user = await getUserByUsername(username);
    if (!user) {
      return false;
    }
    
    // Check which password field the user record has
    const passwordField = user.password_hash ? 'password_hash' : 'password';
    
    return await bcrypt.compare(password, user[passwordField]);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

module.exports = {
  initializeUserTable,
  getUserByUsername,
  getUserByEmail,
  getUserById,
  createUser,
  verifyUser,
  updateUser,
  verifyPassword
};