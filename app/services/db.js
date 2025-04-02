require("dotenv").config();

const mysql = require('mysql2/promise');

// Try different connection configurations
const getConnectionConfig = () => {
  // Default configuration
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.MYSQL_ROOT_USER || 'root',
    password: process.env.MYSQL_ROOT_PASSWORD || 'password',
    database: process.env.MYSQL_DATABASE || 'Game-Tips-DB',
    waitForConnections: true,
    connectionLimit: 2,
    queueLimit: 0,
  };

  console.log("Attempting database connection with config:", {
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database
  });

  return config;
};

// Create pool with connection settings
const pool = mysql.createPool(getConnectionConfig());

// Utility function to query the database
async function query(sql, params) {
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
    const result = await query('SELECT 1 as test');
    console.log("Database connection test successful:", result);
    return true;
  } catch (error) {
    console.error("Database connection test failed:", error.message);
    return false;
  }
}

// Execute the test immediately
testConnection();

module.exports = {
  query,
  testConnection
};