const express = require("express");
const mysql = require("mysql2");

const app = express();

// Set up Pug
app.set("view engine", "pug");
app.set("views", "./views");

// Connect to MySQL (Replace with your actual database credentials)
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // Change if your MySQL user is different
  password: "password", // Add your password if you have one
  database: "database",
});

db.connect((err) => {
  if (err) {
    console.error("MySQL connection error:", err);
  } else {
    console.log("Connected to MySQL Database");
  }
});
