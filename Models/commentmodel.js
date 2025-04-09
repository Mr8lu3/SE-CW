// models/commentmodel.js
const db = require('../app/services/db'); // Update path to use your active db.js file

// Get comments for a specific forum post
async function getCommentsForPost(postId) {
  const query = `
    SELECT comment_id, content, created_at 
    FROM forum_comments 
    WHERE post_id = ?
    ORDER BY created_at ASC;
  `;
  return db.query(query, [postId]);
}

// Add a new comment to a forum post
async function addComment(postId, content, userId = null) {
  try {
    console.log(`Attempting to add comment to post ${postId}: "${content}"`);
    
    // First check if the forum exists with this post_id
    const checkPostQuery = `
      SELECT COUNT(*) as postExists 
      FROM forum 
      WHERE post_id = ?;
    `;
    
    const postCheck = await db.query(checkPostQuery, [postId]);
    if (postCheck[0].postExists === 0) {
      console.error(`No forum post found with ID: ${postId}`);
      throw new Error('Forum post not found');
    }
    
    // Ensure table exists - this is a more reliable way to handle table creation
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS forum_comments (
        comment_id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        user_id INT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX post_idx (post_id)
      );
    `;
    await db.query(createTableQuery);
    
    // Now insert the comment using a simpler query
    const insertQuery = `
      INSERT INTO forum_comments (post_id, user_id, content) 
      VALUES (?, ?, ?);
    `;
    
    const result = await db.query(insertQuery, [postId, userId, content]);
    console.log(`Comment added successfully with ID: ${result.insertId}`);
    return result;
  } catch (error) {
    console.error('Error adding comment:', error.message);
    throw error;
  }
}

// Get all comments
async function getAllComments() {
  const query = `
    SELECT comment_id, post_id, user_id, content, created_at 
    FROM forum_comments 
    ORDER BY created_at DESC;
  `;
  return db.query(query);
}

module.exports = {
  getCommentsForPost,
  addComment,
  getAllComments
};
