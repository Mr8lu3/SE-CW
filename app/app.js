const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const db = require('./services/db'); // Ensure the path to db.js is correct
const path = require('path');

// Middleware for parsing form data
app.use(bodyParser.urlencoded({ extended: true }));

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
    // Query to get forum posts with their comments and tags
    const forumPosts = await db.query(`
      SELECT forum.post_id, forum.forum_title, forum.content AS post_content,
             forum_comments.comment_id, forum_comments.content AS comment_content,
             forum.forum_tags
      FROM forum
      LEFT JOIN forum_comments ON forum.post_id = forum_comments.post_id
      ORDER BY forum.post_id ASC, forum_comments.created_at ASC;
    `);
    
    // Organize the data into a format usable by the view
    const forums = [];

    forumPosts.forEach(post => {
      let forum = forums.find(f => f.id === post.post_id);
      if (!forum) {
        forum = { id: post.post_id, title: post.forum_title, tags: post.forum_tags.split(','), posts: [] };
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
    console.error(error);
    res.status(500).send('Internal Server Error');
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

// Start the server
app.listen(3000, () => {
  console.log("Forum app running at http://localhost:3000");
});
