// models/commentModel.js
const db = require('../services/db');

// Get comments for a specific forum post
async function getCommentsForPost(postId) {
  const query = `
    SELECT comment_id, content, created_at 
    FROM forum_comments 
    WHERE post_id = ?
    ORDER BY created_at ASC;
  `;
  return db.query(query, [postId]); // Executes the query using db.js connection
}

// Add a new comment to a forum post
async function addComment(postId, userId, commentContent) {
  const query = `
    INSERT INTO forum_comments (post_id, user_id, content) 
    VALUES (?, ?, ?);
  `;
  await db.query(query, [postId, userId, commentContent]);
}

module.exports = {
  getCommentsForPost,
  addComment
};
