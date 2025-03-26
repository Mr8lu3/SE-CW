// controllers/forumController.js
const forumModel = require('../models/forumModel'); // Import the forum model

// Controller to get all forums with their posts and comments
async function getForums(req, res) {
  try {
    // Fetch forums from the model
    const forumPosts = await forumModel.getAllForums();

    // Format the data if needed (grouping posts and comments)
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

    // Send the formatted data to the view (Pug template)
    res.render('Forum', { forums });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}

// Add other routes for handling other forum-related logic, such as adding comments, etc.

module.exports = {
  getForums
};
