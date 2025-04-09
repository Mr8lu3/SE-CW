require("dotenv").config();

const mysql = require('mysql2/promise');

// Try different connection configurations
const getConnectionConfig = () => {
  // Default configuration
  const config = {
    host: process.env.DB_HOST || process.env.MYSQL_HOST || 'db', // Changed to 'db' to match docker-compose service name
    port: parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || '3306'),
    user: process.env.DB_USER || process.env.MYSQL_USER || process.env.MYSQL_ROOT_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || 'password',
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'Game-Tips-DB',
    waitForConnections: true,
    connectionLimit: 2,
    queueLimit: 0,
    connectTimeout: 30000, // Increased to 30 seconds timeout for Docker startup
    // Docker container name takes priority, then hostname, then localhost
    ...(process.env.DB_CONTAINER && { host: process.env.DB_CONTAINER })
  };

  console.log("Attempting database connection with config:", {
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database
  });

  return config;
};

// Create pool with connection settings - will be initialized after retries
let pool = null;

// Retry mechanism for database connection
async function initializePool(retries = 15, delay = 2000) {
  let attempt = 0;
  
  while (attempt < retries) {
    try {
      console.log(`Database connection attempt ${attempt + 1}/${retries}...`);
      pool = mysql.createPool(getConnectionConfig());
      
      // Test the connection
      await pool.execute('SELECT 1 as test');
      console.log("Database connection established successfully!");
      return true;
    } catch (error) {
      attempt++;
      console.error(`Database connection attempt ${attempt} failed:`, error.message);
      
      if (attempt >= retries) {
        console.error("All database connection attempts failed. Proceeding with unavailable database.");
        pool = mysql.createPool(getConnectionConfig()); // Create pool anyway for future attempts
        return false;
      }
      
      console.log(`Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Utility function to query the database
async function query(sql, params) {
  if (!pool) {
    // If pool doesn't exist yet, try to initialize it
    await initializePool();
  }
  
  try {
    const [rows, fields] = await pool.execute(sql, params || []);
    return rows;
  } catch (error) {
    console.error("Database query error:", error.message);
    console.error("SQL:", sql);
    console.error("Parameters:", params);
    throw error; // Rethrow the error for the route handler to catch
  }
}

// Test the database connection
async function testConnection() {
  try {
    if (!pool) {
      await initializePool();
    }
    
    const result = await query('SELECT 1 as test');
    console.log("Database connection test successful:", result);
    return true;
  } catch (error) {
    console.error("Database connection test failed:", error.message);
    // Additional info for debugging Docker connection issues
    console.error("Connection details used:",
      "host:", process.env.DB_HOST || process.env.MYSQL_HOST || 'db',
      "port:", process.env.DB_PORT || process.env.MYSQL_PORT || '3306',
      "user:", process.env.DB_USER || process.env.MYSQL_USER || process.env.MYSQL_ROOT_USER || 'root',
      "database:", process.env.DB_NAME || process.env.MYSQL_DATABASE || 'Game-Tips-DB'
    );
    return false;
  }
}

// Initialize the pool with retries
(async () => {
  await initializePool();
})();

module.exports = {
  query,
  testConnection,
  initializePool
};