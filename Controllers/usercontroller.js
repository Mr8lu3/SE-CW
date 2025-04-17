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
      
      // Redirect to userpage instead of homepage
      res.redirect('/userpage');
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
        
        console.log('User session created, redirecting to userpage');
        // Redirect to userpage instead of homepage
        res.redirect('/userpage');
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

// Reset admin password
async function resetAdminPassword(req, res) {
  try {
    console.log('Attempting to reset admin password...');
    
    // Check if admin exists
    const adminUser = await UserModel.getUserByUsername('admin');
    
    if (!adminUser) {
      console.log('Admin user does not exist, creating it...');
      // If admin doesn't exist, create it
      const userId = await UserModel.createUser('admin', 'admin123', 'admin@gamingtips.com');
      
      if (userId) {
        // Update to make admin
        await db.query('UPDATE users SET is_admin = true, role_id = 1 WHERE username = ?', ['admin']);
        console.log('Admin user created successfully');
        return res.render('Login', { success: 'Admin account created! Username: admin, Password: admin123' });
      }
    } else {
      console.log('Admin user exists, resetting password...');
      
      // Reset admin password to admin123
      const updateResult = await UserModel.updateUser(adminUser.id || adminUser.user_id, {
        password: 'admin123'
      });
      
      if (updateResult) {
        console.log('Admin password reset successfully');
        return res.render('Login', { success: 'Admin password reset! Username: admin, Password: admin123' });
      }
    }
    
    return res.render('Login', { error: 'Failed to reset admin password' });
  } catch (error) {
    console.error('Error resetting admin password:', error);
    return res.render('Login', { error: 'An error occurred while resetting the admin password' });
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
    
    // Parse favorite games if exists
    let favoriteGames = [];
    if (user.favorite_games) {
      try {
        favoriteGames = JSON.parse(user.favorite_games);
      } catch (err) {
        console.error('Error parsing favorite games JSON:', err);
      }
    }
    
    res.render('userpage', { 
      user: user,
      isAdmin: user.is_admin,
      favorite_games: favoriteGames
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).render('error', { error: 'Failed to retrieve user profile' });
  }
}

// Get public user profile by user ID
async function getPublicUserProfile(req, res) {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      console.error('No user ID provided in request params');
      return res.status(400).render('error', { error: 'User ID is required' });
    }
    
    console.log(`Fetching public profile for user ID: ${userId}`);
    const user = await UserModel.getUserById(userId);
    
    if (!user) {
      console.error(`User with ID ${userId} not found in database`);
      return res.status(404).render('error', { error: 'User not found' });
    }
    
    console.log(`Found user: ${user.username} (ID: ${user.id || user.user_id})`);
    
    // Parse favorite games if exists
    let favoriteGames = [];
    if (user.favorite_games) {
      try {
        favoriteGames = JSON.parse(user.favorite_games);
        console.log(`Parsed favorite games: ${favoriteGames.join(', ')}`);
      } catch (err) {
        console.error('Error parsing favorite games JSON:', err);
      }
    }
    
    // Check if this is the logged-in user viewing their own profile
    const isOwnProfile = req.session.loggedIn && 
                        (req.session.user.id === parseInt(userId) || 
                         req.session.user.user_id === parseInt(userId));
    
    console.log(`Is own profile: ${isOwnProfile}`);
    console.log(`Rendering public profile with data:`, {
      username: user.username,
      isAdmin: user.is_admin,
      favoriteGamesCount: favoriteGames.length,
      isOwnProfile: isOwnProfile,
      loggedIn: req.session.loggedIn || false
    });
    
    // Render the public profile view
    res.render('publicprofile', {
      profileUser: user,
      isAdmin: user.is_admin,
      favorite_games: favoriteGames,
      isOwnProfile: isOwnProfile,
      loggedIn: req.session.loggedIn || false
    });
  } catch (error) {
    console.error('Error getting public user profile:', error);
    res.status(500).render('error', { error: 'Failed to retrieve user profile' });
  }
}

// Get public user profile by username
async function getPublicUserProfileByUsername(req, res) {
  try {
    const username = req.params.username;
    
    if (!username) {
      console.error('No username provided in request params');
      return res.status(400).render('error', { error: 'Username is required' });
    }
    
    console.log(`Fetching public profile for username: ${username}`);
    const user = await UserModel.getUserByUsername(username);
    
    if (!user) {
      console.error(`User with username ${username} not found in database`);
      return res.status(404).render('error', { error: 'User not found' });
    }
    
    console.log(`Found user: ${user.username} (ID: ${user.id || user.user_id})`);
    
    // Parse favorite games if exists
    let favoriteGames = [];
    if (user.favorite_games) {
      try {
        favoriteGames = JSON.parse(user.favorite_games);
        console.log(`Parsed favorite games: ${favoriteGames.join(', ')}`);
      } catch (err) {
        console.error('Error parsing favorite games JSON:', err);
      }
    }
    
    // Check if this is the logged-in user viewing their own profile
    const isOwnProfile = req.session.loggedIn && 
                        req.session.user.username === username;
    
    console.log(`Is own profile: ${isOwnProfile}`);
    console.log(`Rendering public profile with data:`, {
      username: user.username,
      isAdmin: user.is_admin,
      favoriteGamesCount: favoriteGames.length,
      isOwnProfile: isOwnProfile,
      loggedIn: req.session.loggedIn || false
    });
    
    // Render the public profile view
    res.render('publicprofile', {
      profileUser: user,
      isAdmin: user.is_admin,
      favorite_games: favoriteGames,
      isOwnProfile: isOwnProfile,
      loggedIn: req.session.loggedIn || false
    });
  } catch (error) {
    console.error('Error getting public user profile by username:', error);
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
    
    // Log the entire request body for debugging
    console.log('Form data received:', req.body);
    
    // Handle favorite games properly - there are three possible forms the data could take
    let favoriteGamesArray = [];
    
    if (req.body.favorite_games) {
      // Case 1: If it comes as favorite_games and is already an array
      favoriteGamesArray = Array.isArray(req.body.favorite_games) 
        ? req.body.favorite_games 
        : [req.body.favorite_games];
    } else if (req.body['favorite_games[]']) {
      // Case 2: If it comes as favorite_games[] (common with some form submissions)
      favoriteGamesArray = Array.isArray(req.body['favorite_games[]']) 
        ? req.body['favorite_games[]'] 
        : [req.body['favorite_games[]']];
    }
    
    console.log('Favorite games selected:', favoriteGamesArray);
    
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
    
    // Always save favorite games (even if empty - user might want to clear their favorites)
    updateData.favorite_games = JSON.stringify(favoriteGamesArray);
    
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
            user: req.session.user,
            favorite_games: favoriteGamesArray
          });
        }
        
        return res.render('userpage', { 
          success: passwordChanged ? 'Profile and password updated successfully!' : 'Profile updated successfully!',
          user: updatedUser,
          favorite_games: favoriteGamesArray
        });
      });
    } else {
      // No changes were made
      return res.render('userpage', { 
        info: 'No changes made to profile', 
        user: req.session.user,
        favorite_games: user.favorite_games ? JSON.parse(user.favorite_games) : []
      });
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

// Admin user management page
async function adminManageUsers(req, res) {
  try {
    // Check if user is admin
    if (!req.session.loggedIn || !req.session.user.is_admin) {
      return res.redirect('/Login');
    }
    
    // Get all users from database
    const query = 'SELECT * FROM users ORDER BY created_at DESC';
    const users = await db.query(query);
    
    // Render the admin users management page
    res.render('admin-users', { 
      users,
      currentUser: req.session.user
    });
  } catch (error) {
    console.error('Error fetching users for admin:', error);
    res.status(500).render('error', { error: 'Failed to load user management' });
  }
}

// Admin delete user
async function adminDeleteUser(req, res) {
  try {
    // Check if user is admin
    if (!req.session.loggedIn || !req.session.user.is_admin) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    const userId = req.body.userId;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    
    // Check if attempting to delete self
    if (userId == req.session.user.id || userId == req.session.user.user_id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    
    // Delete user
    const deleteQuery = 'DELETE FROM users WHERE user_id = ? OR id = ?';
    const result = await db.query(deleteQuery, [userId, userId]);
    
    if (result.affectedRows > 0) {
      return res.json({ success: true, message: 'User deleted successfully' });
    } else {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'An error occurred while deleting the user' });
  }
}

// Admin toggle user's admin status
async function adminToggleAdminStatus(req, res) {
  try {
    // Check if user is admin
    if (!req.session.loggedIn || !req.session.user.is_admin) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    const userId = req.body.userId;
    const makeAdmin = req.body.makeAdmin === 'true'; 
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    
    // Update user's admin status
    const updateQuery = 'UPDATE users SET is_admin = ?, role_id = ? WHERE user_id = ? OR id = ?';
    const roleId = makeAdmin ? 1 : 2; // 1 for admin, 2 for regular user
    const result = await db.query(updateQuery, [makeAdmin, roleId, userId, userId]);
    
    if (result.affectedRows > 0) {
      return res.json({ 
        success: true, 
        message: `User is now ${makeAdmin ? 'an admin' : 'a regular user'}`
      });
    } else {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Error toggling admin status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while updating user status' 
    });
  }
}

// Admin guides management page
async function adminManageGuides(req, res) {
  try {
    // Check if user is admin
    if (!req.session.loggedIn || !req.session.user.is_admin) {
      return res.redirect('/Login');
    }
    
    // For now, we'll use the static guides data
    // In a real implementation, this would come from a database
    const guides = [
      {
        id: 1,
        title: 'How to Improve Your FPS in Games',
        category: 'fps',
        content: 'In this guide, we will explore various methods to improve your FPS in games...',
        publishDate: '2025-03-16'
      },
      {
        id: 2,
        title: 'Best RPG Builds for Beginners',
        category: 'rpg',
        content: 'RPGs can be overwhelming for beginners, so we\'ve compiled the best builds...',
        publishDate: '2025-03-10'
      },
      {
        id: 3,
        title: 'Essential Mods for Skyrim',
        category: 'mods',
        content: 'Mods can drastically change the way you experience Skyrim...',
        publishDate: '2025-03-05'
      }
    ];
    
    // Render the admin guides management page
    res.render('admin-guides', { guides });
  } catch (error) {
    console.error('Error managing guides:', error);
    res.status(500).render('error', { error: 'Failed to load guides management' });
  }
}

// Admin create guide
async function adminCreateGuide(req, res) {
  try {
    // Check if user is admin
    if (!req.session.loggedIn || !req.session.user.is_admin) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    const { title, category, content } = req.body;
    
    if (!title || !category || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title, category and content are required' 
      });
    }
    
    // In a real implementation, this would save to a database
    // For now, we'll just return success
    
    return res.json({ 
      success: true, 
      message: 'Guide created successfully',
      guide: {
        id: Date.now(), // Simulating an auto-generated ID
        title,
        category,
        content,
        publishDate: new Date().toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Error creating guide:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while creating the guide' 
    });
  }
}

// Admin update guide
async function adminUpdateGuide(req, res) {
  try {
    // Check if user is admin
    if (!req.session.loggedIn || !req.session.user.is_admin) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    const { guideId, title, category, content } = req.body;
    
    if (!guideId || !title || !category || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Guide ID, title, category and content are required' 
      });
    }
    
    // In a real implementation, this would update the database
    // For now, we'll just return success
    
    return res.json({ 
      success: true, 
      message: 'Guide updated successfully'
    });
  } catch (error) {
    console.error('Error updating guide:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while updating the guide' 
    });
  }
}

// Admin delete guide
async function adminDeleteGuide(req, res) {
  try {
    // Check if user is admin
    if (!req.session.loggedIn || !req.session.user.is_admin) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    const { guideId } = req.body;
    
    if (!guideId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Guide ID is required' 
      });
    }
    
    // In a real implementation, this would delete from the database
    // For now, we'll just return success
    
    return res.json({ 
      success: true, 
      message: 'Guide deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting guide:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while deleting the guide' 
    });
  }
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
  logUserData,
  getPublicUserProfile,
  getPublicUserProfileByUsername,
  resetAdminPassword,
  adminManageUsers,
  adminDeleteUser,
  adminToggleAdminStatus,
  adminManageGuides,
  adminCreateGuide,
  adminUpdateGuide,
  adminDeleteGuide
};
