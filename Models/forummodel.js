// models/forummodel.js
const db = require('../app/services/db'); // Use the correct path to your db.js file

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
  
  const forumPosts = await db.query(query);

  // Structure the data
  const forums = [];
  
  forumPosts.forEach(post => {
    // Check if the forum already exists in the forums array
    let forum = forums.find(f => f.id === post.post_id);
    
    // If the forum doesn't exist, create a new entry for it
    if (!forum) {
      forum = {
        id: post.post_id,
        title: post.forum_title,
        tags: post.forum_tags ? post.forum_tags.split(',') : [],
        posts: [] // Initialize an empty posts array
      };
      forums.push(forum);
    }

    // Add the post and its comments to the forum
    let forumPost = forum.posts.find(p => p.question === post.post_content);
    if (!forumPost) {
      forumPost = { 
        question: post.post_content, 
        comments: [] 
      };
      forum.posts.push(forumPost);
    }

    // Add the comment to the post if it exists
    if (post.comment_id && post.comment_content) {
      forumPost.comments.push(post.comment_content);
    }
  });

  return forums; // Return the formatted forums data
}

// Get a specific forum by ID
async function getForumById(forumId) {
  const query = `
    SELECT forum.post_id, forum.forum_title, forum.content AS post_content,
           forum_comments.comment_id, forum_comments.content AS comment_content,
           forum.forum_tags
    FROM forum
    LEFT JOIN forum_comments ON forum.post_id = forum_comments.post_id
    WHERE forum.post_id = ?
    ORDER BY forum_comments.created_at ASC;
  `;
  
  const forumPosts = await db.query(query, [forumId]);
  
  if (forumPosts.length === 0) {
    return null;
  }
  
  // Structure the forum data
  const forum = {
    id: forumPosts[0].post_id,
    title: forumPosts[0].forum_title,
    tags: forumPosts[0].forum_tags ? forumPosts[0].forum_tags.split(',') : [],
    posts: []
  };
  
  // Group comments by post
  forumPosts.forEach(post => {
    let forumPost = forum.posts.find(p => p.question === post.post_content);
    
    if (!forumPost) {
      forumPost = {
        question: post.post_content,
        comments: []
      };
      forum.posts.push(forumPost);
    }
    
    if (post.comment_id && post.comment_content) {
      forumPost.comments.push(post.comment_content);
    }
  });
  
  return forum;
}

// Add a new forum post
async function addForumPost(title, content, tags, userId = null) {
  const query = `
    INSERT INTO forum (forum_title, content, forum_tags, user_id, created_at) 
    VALUES (?, ?, ?, ?, NOW());
  `;
  
  const result = await db.query(query, [title, content, tags.join(','), userId]);
  return result.insertId;
}

module.exports = {
  getAllForums,
  getForumById,
  addForumPost
};
