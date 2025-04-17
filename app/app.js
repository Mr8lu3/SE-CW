const express = require('express');
const bodyParser = require('body-parser');
let session;
try {
  session = require('express-session');
  console.log('Express-session loaded successfully');
} catch (error) {
  console.error('Error loading express-session:', error.message);
  // Provide a fallback simple session object if the module is missing
  session = function(options) {
    return function(req, res, next) {
      req.session = req.session || {};
      next();
    };
  };
}

const app = express();
const db = require('./services/db'); // Ensure the path to db.js is correct
const path = require('path');
const forumController = require('../Controllers/forumcontroller');
const userController = require('../Controllers/usercontroller');
const UserModel = require('../Models/usermodel');

// Initialize session middleware
app.use(session({
  secret: 'gaming-tips-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days session expiry
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true // Prevent client-side JS from reading the cookie
  }
}));

// Middleware for parsing form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Add JSON parsing for API requests

// Serve static files
app.use(express.static(path.join(__dirname, '../images')));

// Set the view engine to Pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Middleware to make session user available to all templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.loggedIn = req.session.loggedIn || false;
  next();
});

// Delay database initialization to give MySQL container time to start properly
console.log('Waiting for database to be ready...');
setTimeout(async () => {
  try {
    // First ensure database connection is established with retries
    const dbConnected = await db.initializePool(10, 3000); // 10 attempts, 3 second delay
    
    if (dbConnected) {
      console.log('Database connection established, initializing user table...');
      // Initialize user table and create admin user if needed
      try {
        await UserModel.initializeUserTable();
        console.log('User table initialized successfully');
      } catch (error) {
        console.error('Error initializing user table:', error);
        console.log('Will continue without user authentication features');
      }
    } else {
      console.log('Database connection could not be established, some features may not work');
    }
  } catch (error) {
    console.error('Error during startup:', error);
  }
}, 5000); // Wait 5 seconds before trying to initialize

// Apply authentication middleware to protected routes
app.use('/userpage', userController.checkAuthentication);
app.use('/Forum/post', userController.checkAuthentication); 
app.use('/admin', userController.checkAuthentication);

// Route for the home page
app.get("/", (req, res) => {
  res.render("index");
});

// Auth routes
app.get('/Login', (req, res) => {
  res.render('Login');
});

app.post('/login', userController.login);

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', userController.register);

app.get('/logout', userController.logout);

// Admin password reset route
app.get('/reset-admin', userController.resetAdminPassword);

// Force creation of a non-admin user
app.get('/create-non-admin-user', userController.createNonAdminUser);

// Admin routes
app.get('/admin', userController.adminDashboard);
app.get('/admin/users', userController.adminManageUsers);
app.get('/admin/forums', forumController.adminManageForums);
app.get('/admin/guides', userController.adminManageGuides);

// Admin actions - users
app.post('/admin/users/delete', userController.adminDeleteUser);
app.post('/admin/users/toggle-admin', userController.adminToggleAdminStatus);

// Admin actions - forums
app.post('/admin/forums/create', forumController.adminCreateForum);
app.post('/admin/forums/delete', forumController.adminDeleteForum);
app.post('/admin/comments/delete', forumController.adminDeleteComment);

// Admin actions - guides
app.post('/admin/guides/create', userController.adminCreateGuide);
app.post('/admin/guides/delete', userController.adminDeleteGuide);
app.post('/admin/guides/update', userController.adminUpdateGuide);

// Protected user profile route
app.get('/userpage', userController.getUserProfile);

// Public user profile routes (support both ID and username)
app.get('/user/:userId', userController.getPublicUserProfile);
app.get('/profile/:username', userController.getPublicUserProfileByUsername);

// Profile update route
app.post('/update-profile', userController.checkAuthentication, userController.updateUserProfile);

// Forum routes
app.get('/Forum', forumController.getAllForums);
app.post('/comments', forumController.addComment);

// Other page routes
app.get("/Guides", (req, res) => {
  res.render("Guides");
});

app.get("/Details_page", (req, res) => {
  res.render("Details_page");
});

// Start the server
app.listen(3000, () => {
  console.log("Forum app running at http://localhost:3000");
  console.log("Database connection settings:");
  console.log("- Host:", process.env.DB_CONTAINER || process.env.DB_HOST || process.env.MYSQL_HOST);
  console.log("- Database:", process.env.MYSQL_DATABASE || process.env.DB_NAME);
});
