// Controllers/usercontroller.js
const UserModel = require('../Models/usermodel');
const db = require('../app/services/db');

// Login user
async function login(req, res) {
  try {
    const { username, password, remember } = req.body;
    
    if (!username || !password) {
      return res.render('Login', { error: 'Username/Email and password are required' });
    }
    
    // Verify user credentials (now supports both username and email)
    const user = await UserModel.verifyUser(username, password);
    
    if (!user) {
      return res.render('Login', { error: 'Invalid username/email or password' });
    }
    
    // Log detailed user information for debugging
    logUserData('User from database on login', user);
    
    // Ensure the user object has an id property
    // This is a critical step because some rows might have user_id instead of id
    if (!user.id && user.user_id) {
      user.id = user.user_id;
    }
    
    // Create user session with persistent cookie
    req.session.user = user;
    req.session.loggedIn = true;
    
    // Set persistent cookie if "remember me" is checked
    if (remember === 'on') {
      // Set cookie to last for 30 days
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    }
    
    // Save the session explicitly to ensure it's stored
    req.session.save(err => {
      if (err) {
        console.error('Error saving session:', err);
        return res.render('Login', { error: 'Failed to create session' });
      }
      
      console.log('Session saved successfully. Session ID:', req.sessionID);
      logUserData('User in session after login', req.session.user);
      
      // Redirect to appropriate page
      if (user.is_admin) {
        return res.redirect('/admin');
      }
      
      res.redirect('/');
    });
  } catch (error) {
    console.error('Login error:', error);
    res.render('Login', { error: 'An error occurred during login' });
  }
}

// Register new user
async function register(req, res) {
  try {
    console.log('Registration process started');
    console.log('Form data received:', { 
      username: req.body.username,
      email: req.body.email,
      password: req.body.password ? '[PROVIDED]' : '[MISSING]',
      confirm_password: req.body.confirm_password ? '[PROVIDED]' : '[MISSING]'
    });
    
    const { username, password, confirm_password, email } = req.body;
    
    // Validation checks
    if (!username || !password || !email) {
      console.log('Registration failed: Missing required fields');
      return res.render('signup', { error: 'Username, email and password are required' });
    }
    
    // Check if password and confirm_password match
    if (password !== confirm_password) {
      console.log('Registration failed: Passwords do not match');
      return res.render('signup', { error: 'Passwords do not match' });
    }

    // Password strength validation
    if (password.length < 8) {
      console.log('Registration failed: Password too short');
      return res.render('signup', { error: 'Password must be at least 8 characters long' });
    }
    
    // Check if user already exists
    console.log(`Checking if username "${username}" already exists`);
    const existingUser = await UserModel.getUserByUsername(username);
    if (existingUser) {
      console.log('Registration failed: Username already taken');
      return res.render('signup', { error: 'Username already taken' });
    }
    
    // Check if email is already in use
    const emailCheckQuery = 'SELECT * FROM users WHERE email = ?';
    const emailExists = await db.query(emailCheckQuery, [email]);
    if (emailExists && emailExists.length > 0) {
      console.log('Registration failed: Email already in use');
      return res.render('signup', { error: 'Email address is already registered' });
    }
    
    // Create user
    console.log('Creating new user in database');
    try {
      const userId = await UserModel.createUser(username, password, email);
      console.log(`User created with ID: ${userId}`);
      
      // Get the created user
      console.log(`Retrieving created user with ID: ${userId}`);
      const user = await UserModel.getUserById(userId);
      
      if (!user) {
        console.log('Failed to retrieve the newly created user');
        return res.render('signup', { error: 'User created but could not be retrieved. Please try logging in.' });
      }
      
      console.log('User retrieved successfully:', { id: user.id, username: user.username });
      
      req.session.user = user;
      req.session.loggedIn = true;
      
      // Save the session explicitly to ensure it's stored
      req.session.save(err => {
        if (err) {
          console.error('Error saving session:', err);
          return res.render('signup', { error: 'Account created but session could not be established. Please log in.' });
        }
        
        console.log('User session created, redirecting to homepage');
        res.redirect('/');
      });
    } catch (createError) {
      console.error('Error during user creation step:', createError);
      return res.render('signup', { error: `Registration failed: ${createError.message}` });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.render('signup', { error: 'An error occurred during registration' });
  }
}

// Force create a non-admin user
async function createNonAdminUser(req, res) {
  try {
    // Define fixed credentials for the new non-admin user
    const username = `user_${Date.now()}`;  // Generate a unique username based on timestamp
    const password = 'password123';  // Simple password for demo
    const email = `${username}@example.com`;
    
    console.log(`Creating forced non-admin user: ${username}`);
    
    // Check if user already exists (shouldn't happen with timestamp-based username)
    const existingUser = await UserModel.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'Username already exists, try again' 
      });
    }
    
    // Create the non-admin user
    const userId = await UserModel.createUser(username, password, email);
    
    // Get the created user
    const user = await UserModel.getUserById(userId);
    
    if (!user) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to retrieve created user' 
      });
    }
    
    return res.status(201).json({ 
      success: true, 
      message: 'Non-admin user created successfully', 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        isAdmin: user.is_admin 
      },
      credentials: {
        username: username,
        password: password
      }
    });
  } catch (error) {
    console.error('Error creating non-admin user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create non-admin user', 
      error: error.message 
    });
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
    
    logUserData('User data in session when accessing profile', req.session.user);
    
    // Handle ID field inconsistency - try both id and user_id
    const userId = req.session.user.id || req.session.user.user_id;
    
    if (userId === undefined) {
      console.error('User ID is missing in session');
      req.session.loggedIn = false;
      return res.redirect('/Login');
    }
    
    const user = await UserModel.getUserById(userId);
    
    if (!user) {
      console.error(`User with ID ${userId} not found in database`);
      req.session.loggedIn = false;
      return res.redirect('/Login');
    }
    
    // Ensure the user object has consistent ID fields
    if (!user.id && user.user_id) {
      user.id = user.user_id;
    } else if (!user.user_id && user.id) {
      user.user_id = user.id;
    }
    
    // Update the session with fresh user data
    req.session.user = user;
    req.session.save();
    
    res.render('userpage', { 
      user: user,
      isAdmin: user.is_admin 
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).render('error', { error: 'Failed to retrieve user profile' });
  }
}

// Update user profile
async function updateUserProfile(req, res) {
  try {
    // Check if user is logged in
    if (!req.session.loggedIn) {
      return res.redirect('/Login');
    }
    
    const userId = req.session.user.id;
    const { email, current_password, new_password, confirm_password } = req.body;
    
    // Get current user data
    const user = await UserModel.getUserById(userId);
    if (!user) {
      return res.status(404).render('userpage', { error: 'User not found', user: req.session.user });
    }
    
    let updateData = {};
    let passwordChanged = false;
    
    // Update email if provided
    if (email && email !== user.email) {
      // Check if email is already in use by another user
      const emailCheckQuery = 'SELECT * FROM users WHERE email = ? AND id != ?';
      const emailExists = await db.query(emailCheckQuery, [email, userId]);
      if (emailExists && emailExists.length > 0) {
        return res.render('userpage', { error: 'Email address is already registered', user: req.session.user });
      }
      updateData.email = email;
    }
    
    // Handle password change if requested
    if (new_password) {
      // Verify current password
      if (!current_password) {
        return res.render('userpage', { error: 'Current password is required to set a new password', user: req.session.user });
      }
      
      // Verify current password is correct
      const isValidPassword = await UserModel.verifyPassword(user.username, current_password);
      if (!isValidPassword) {
        return res.render('userpage', { error: 'Current password is incorrect', user: req.session.user });
      }
      
      // Check new password requirements
      if (new_password.length < 8) {
        return res.render('userpage', { error: 'New password must be at least 8 characters long', user: req.session.user });
      }
      
      // Check if password confirmation matches
      if (new_password !== confirm_password) {
        return res.render('userpage', { error: 'New passwords do not match', user: req.session.user });
      }
      
      updateData.password = new_password;
      passwordChanged = true;
    }
    
    // Only proceed if there are changes to make
    if (Object.keys(updateData).length > 0) {
      // Update the user profile
      await UserModel.updateUser(userId, updateData);
      
      // Update session with new user data
      const updatedUser = await UserModel.getUserById(userId);
      req.session.user = updatedUser;
      
      // Re-save session with updated user data
      req.session.save(err => {
        if (err) {
          console.error('Error saving updated session:', err);
          return res.render('userpage', { 
            error: 'Profile updated but session could not be refreshed', 
            success: 'Profile updated successfully!',
            user: req.session.user 
          });
        }
        
        return res.render('userpage', { 
          success: passwordChanged ? 'Profile and password updated successfully!' : 'Profile updated successfully!',
          user: updatedUser
        });
      });
    } else {
      // No changes were made
      return res.render('userpage', { info: 'No changes made to profile', user: req.session.user });
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.render('userpage', { error: 'An error occurred while updating your profile', user: req.session.user });
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

// Ensure session is refreshed for authenticated routes
function checkAuthentication(req, res, next) {
  if (req.session && req.session.loggedIn) {
    // Extend session validity on each request
    req.session.touch();
    
    // Check if we have valid user data
    if (!req.session.user) {
      console.warn('Session marked as logged in but user object is missing');
      req.session.loggedIn = false;
      return res.redirect('/Login');
    }
    
    // Handle ID field inconsistency - try both id and user_id
    const userId = req.session.user.id || req.session.user.user_id;
    
    if (userId !== undefined) {
      console.log(`Refreshing user data for ID: ${userId}`);
      
      // First standardize the user object to have both id fields
      if (!req.session.user.id && req.session.user.user_id) {
        req.session.user.id = req.session.user.user_id;
      } else if (!req.session.user.user_id && req.session.user.id) {
        req.session.user.user_id = req.session.user.id;
      }
      
      UserModel.getUserById(userId)
        .then(freshUserData => {
          if (freshUserData) {
            // Ensure the fresh user data has both id fields
            if (!freshUserData.id && freshUserData.user_id) {
              freshUserData.id = freshUserData.user_id;
            } else if (!freshUserData.user_id && freshUserData.id) {
              freshUserData.user_id = freshUserData.id;
            }
            
            req.session.user = freshUserData;
            logUserData('Refreshed user data in checkAuthentication', freshUserData);
            
            // Make sure to explicitly save the session to persist the standardized ID fields
            req.session.save(err => {
              if (err) {
                console.error('Error saving session after user refresh:', err);
              }
              return next();
            });
          } else {
            console.warn(`User with ID ${userId} no longer exists in database`);
            // User no longer exists in DB, destroy session
            req.session.destroy(err => {
              if (err) console.error('Error destroying invalid session:', err);
              return res.redirect('/Login');
            });
          }
        })
        .catch(err => {
          console.error('Error refreshing user data:', err);
          return next();
        });
    } else {
      console.warn('Session marked as logged in but user ID is missing or invalid');
      logUserData('Invalid user data in session', req.session.user);
      
      // User session data is invalid, clear it
      req.session.loggedIn = false;
      return res.redirect('/Login');
    }
  } else {
    // Redirect to login if not authenticated
    res.redirect('/Login');
  }
}

// Helper function to log user data structure - helps with debugging
function logUserData(prefix, user) {
  if (!user) {
    console.log(`${prefix}: User is null or undefined`);
    return;
  }
  console.log(`${prefix}: User data structure:`);
  console.log(`- ID type: ${typeof user.id}, value: ${user.id}`);
  console.log(`- Has user_id: ${user.user_id !== undefined}, value: ${user.user_id}`);
  console.log(`- Username: ${user.username}`);
  console.log(`- Is Admin: ${user.is_admin}`);
  
  // Log all user properties for debugging
  console.log('- All properties:', Object.keys(user));
}

module.exports = {
  login,
  register,
  logout,
  getUserProfile,
  adminDashboard,
  createNonAdminUser,
  updateUserProfile,
  checkAuthentication,
  logUserData
};
