const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const db = require('./services/db'); // Ensure the path to db.js is correct
const path = require('path');

// Middleware for parsing form data
app.use(bodyParser.urlencoded({ extended: true }));
// Serve static files
app.use(express.static(path.join(__dirname, '../images')));

// Set the view engine to Pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Route for the home page
app.get("/", (req, res) => {
  res.render("index");
});

// Route to display forum page
app.get('/Forum', async (req, res) => {
  try {
    // First, verify database connection
    console.log("Attempting database connection for Forum page...");
    
    // Test database connection with error details
    try {
      const testQuery = await db.query('SELECT 1 as test');
      console.log("Database connection successful:", testQuery);
    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      throw new Error(`Database connection error: ${dbError.message}`);
    }
    
    // Check if forum table exists
    try {
      const tableCheck = await db.query("SHOW TABLES LIKE 'forum'");
      console.log("Forum table check:", tableCheck.length ? "Table exists" : "Table does not exist");
      
      if (!tableCheck.length) {
        throw new Error("The 'forum' table does not exist in the database");
      }
    } catch (tableError) {
      console.error("Error checking forum table:", tableError);
      throw new Error(`Table check error: ${tableError.message}`);
    }

    // Now attempt to fetch forum data
    const forumPosts = await db.query(`
      SELECT forum.post_id, forum.forum_title, forum.content AS post_content,
             forum_comments.comment_id, forum_comments.content AS comment_content,
             forum.forum_tags
      FROM forum
      LEFT JOIN forum_comments ON forum.post_id = forum_comments.post_id
      ORDER BY forum.post_id ASC, forum_comments.created_at ASC;
    `);
    
    console.log(`Retrieved ${forumPosts.length} forum posts`);
    
    // Organize the data into a format usable by the view
    const forums = [];

    forumPosts.forEach(post => {
      let forum = forums.find(f => f.id === post.post_id);
      if (!forum) {
        // Handle potential null forum_tags
        const tags = post.forum_tags ? post.forum_tags.split(',') : [];
        forum = { id: post.post_id, title: post.forum_title, tags: tags, posts: [] };
        forums.push(forum);
      }

      let forumPost = forum.posts.find(p => p.question === post.post_content);
      if (!forumPost) {
        forumPost = { question: post.post_content, comments: [] };
        forum.posts.push(forumPost);
      }

      if (post.comment_id) {
        forumPost.comments.push(post.comment_content);
      }
    });

    res.render('Forum', { forums });
  } catch (error) {
    console.error("Forum error:", error);
    // Provide a more user-friendly error page with detailed information for development
    res.status(500).render('error', { 
      message: 'Error loading forum content: ' + error.message,
      error: {
        status: 500,
        stack: process.env.NODE_ENV === 'development' ? error.stack : ''
      }
    });
  }
});

// Handle comment submission
app.post('/Forum', async (req, res) => {
  const { comment, postId } = req.body; // Get the comment and postId from the form

  try {
    // Insert the comment into the database
    await db.query('INSERT INTO forum_comments (post_id, content) VALUES (?, ?)', [postId, comment]);

    // Redirect back to the forum page after adding the comment
    res.redirect('/Forum');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Add route for Login page
app.get("/Login", (req, res) => {
  res.render("Login");
});

// Routes for other pages
app.get("/Guides", (req, res) => {
  res.render("Guides");
});

app.get("/Details_page", (req, res) => {
  res.render("Details_page");
});

app.get("/userpage", (req, res) => {
  res.render("userpage");
});

// Add route for signup page
app.get("/signup", (req, res) => {
  res.render("signup");
});

// Start the server
app.listen(3000, () => {
  console.log("Forum app running at http://localhost:3000");
  console.log("Database connection settings:");
  console.log("- Host:", process.env.DB_CONTAINER || process.env.DB_HOST || process.env.MYSQL_HOST);
  console.log("- Database:", process.env.MYSQL_DATABASE || process.env.DB_NAME);
});
