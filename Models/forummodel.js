// models/forumModel.js
const db = require('../services/db'); // Import the db connection

// Get all forums with their posts and comments
async function getAllForums() {
  const query = `
    SELECT forum.post_id, forum.forum_title, forum.content AS post_content,
           forum_comments.comment_id, forum_comments.content AS comment_content,
           forum.forum_tags
    FROM forum
    LEFT JOIN forum_comments ON forum.post_id = forum_comments.post_id
    ORDER BY forum.post_id ASC, forum_comments.created_at ASC;
  `;
  return db.query(query); // Executes the query using db.js connection
}

// Add other functions like getForumById, addComment, etc.

module.exports = {
  getAllForums
};
