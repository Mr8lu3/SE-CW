// Controllers/usercontroller.js
const UserModel = require('../Models/usermodel');

// Login user
async function login(req, res) {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.render('Login', { error: 'Username and password are required' });
    }
    
    // Verify user credentials
    const user = await UserModel.verifyUser(username, password);
    
    if (!user) {
      return res.render('Login', { error: 'Invalid username or password' });
    }
    
    // Create user session
    req.session.user = user;
    req.session.loggedIn = true;
    
    // Redirect to appropriate page
    if (user.is_admin) {
      return res.redirect('/admin');
    }
    
    res.redirect('/');
  } catch (error) {
    console.error('Login error:', error);
    res.render('Login', { error: 'An error occurred during login' });
  }
}

// Register new user
async function register(req, res) {
  try {
    const { username, password, email } = req.body;
    
    if (!username || !password) {
      return res.render('signup', { error: 'Username and password are required' });
    }
    
    // Check if user already exists
    const existingUser = await UserModel.getUserByUsername(username);
    if (existingUser) {
      return res.render('signup', { error: 'Username already taken' });
    }
    
    // Create user
    const userId = await UserModel.createUser(username, password, email);
    
    // Get the created user
    const user = await UserModel.getUserById(userId);
    
    // Set up session
    req.session.user = user;
    req.session.loggedIn = true;
    
    res.redirect('/');
  } catch (error) {
    console.error('Registration error:', error);
    res.render('signup', { error: 'An error occurred during registration' });
  }
}

// Logout user
function logout(req, res) {
  req.session.destroy();
  res.redirect('/');
}

// Get user profile
async function getUserProfile(req, res) {
  try {
    // Check if user is logged in
    if (!req.session.loggedIn) {
      return res.redirect('/Login');
    }
    
    const userId = req.session.user.id;
    const user = await UserModel.getUserById(userId);
    
    if (!user) {
      return res.status(404).render('error', { error: 'User not found' });
    }
    
    res.render('userpage', { 
      user: user,
      isAdmin: user.is_admin 
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).render('error', { error: 'Failed to retrieve user profile' });
  }
}

// Admin dashboard
function adminDashboard(req, res) {
  // Check if user is logged in and is an admin
  if (!req.session.loggedIn || !req.session.user.is_admin) {
    return res.redirect('/Login');
  }
  
  res.render('admin', { user: req.session.user });
}

module.exports = {
  login,
  register,
  logout,
  getUserProfile,
  adminDashboard
};
