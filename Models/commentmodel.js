// models/commentmodel.js
const db = require('../app/services/db'); // Update path to use your active db.js file

// Get comments for a specific forum post
async function getCommentsForPost(postId) {
  const query = `
    SELECT c.comment_id, c.content, c.created_at, c.user_id,
           u.username AS author_name
    FROM forum_comments c
    LEFT JOIN users u ON c.user_id = u.user_id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC;
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
    
    // Check if the forum_comments table exists
    const tableExistsQuery = `
      SELECT COUNT(*) as tableExists 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'forum_comments'
    `;
    
    const tableExists = await db.query(tableExistsQuery);
    
    // If table doesn't exist or needs to be recreated
    if (tableExists[0].tableExists === 0) {
      console.log('Creating forum_comments table...');
      
      // Create the table with proper AUTO_INCREMENT
      const createTableQuery = `
        CREATE TABLE forum_comments (
          comment_id INT AUTO_INCREMENT PRIMARY KEY,
          post_id INT NOT NULL,
          user_id INT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX post_idx (post_id)
        );
      `;
      await db.query(createTableQuery);
      console.log('forum_comments table created successfully');
    } else {
      // Table exists - check if comment_id is AUTO_INCREMENT
      console.log('Checking forum_comments table structure...');
      
      const autoIncrementQuery = `
        SELECT COLUMN_NAME, EXTRA
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'forum_comments' 
        AND COLUMN_NAME = 'comment_id' 
      `;
      
      const columnInfo = await db.query(autoIncrementQuery);
      
      if (columnInfo.length === 0) {
        console.error('comment_id column not found in forum_comments table');
        throw new Error('Database schema issue: comment_id column not found');
      }
      
      // If comment_id exists but doesn't have AUTO_INCREMENT
      if (!columnInfo[0].EXTRA.includes('auto_increment')) {
        console.log('Altering comment_id to be AUTO_INCREMENT...');
        
        // Try to modify the table structure
        try {
          // We need to ensure the column is the primary key and auto-increment
          await db.query('ALTER TABLE forum_comments MODIFY comment_id INT AUTO_INCREMENT PRIMARY KEY');
          console.log('comment_id column set to AUTO_INCREMENT');
        } catch (alterError) {
          console.error('Error modifying forum_comments table:', alterError);
          
          // Fallback: Try to get the next comment_id manually
          console.log('Using fallback method to generate comment_id...');
          const maxIdQuery = 'SELECT COALESCE(MAX(comment_id), 0) + 1 AS next_id FROM forum_comments';
          const nextId = await db.query(maxIdQuery);
          
          // Insert with explicit comment_id
          const insertQueryWithId = `
            INSERT INTO forum_comments (comment_id, post_id, user_id, content) 
            VALUES (?, ?, ?, ?);
          `;
          
          const result = await db.query(insertQueryWithId, [nextId[0].next_id, postId, userId, content]);
          console.log(`Comment added successfully with manually generated ID: ${nextId[0].next_id}`);
          return result;
        }
      }
    }
    
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
