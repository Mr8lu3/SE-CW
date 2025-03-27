// // models/forumModel.js
// const db = require('C:\Users\Leoni\OneDrive\Documents\directoryleoSE-CW\app/services/db2.js'); // Import the database connection

// // Get all forums with their posts and comments
// async function getAllForums() {
//   const query = `
//     SELECT forum.post_id, forum.forum_title, forum.content AS post_content,
//            forum_comments.comment_id, forum_comments.content AS comment_content,
//            forum.forum_tags
//     FROM forum
//     LEFT JOIN forum_comments ON forum.post_id = forum_comments.post_id
//     ORDER BY forum.post_id ASC, forum_comments.created_at ASC;
//   `;
  
//   const forumPosts = await db.query(query); // Executes the query using db.js connection

//   // Structure the data
//   const forums = [];
  
//   forumPosts.forEach(post => {
//     // Check if the forum already exists in the forums array
//     let forum = forums.find(f => f.id === post.post_id);
    
//     // If the forum doesn't exist, create a new entry for it
//     if (!forum) {
//       forum = {
//         id: post.post_id,
//         title: post.forum_title,
//         tags: post.forum_tags.split(','),
//         posts: [] // Initialize an empty posts array
//       };
//       forums.push(forum);
//     }

//     // Add the post and its comments to the forum
//     let forumPost = forum.posts.find(p => p.question === post.post_content);
//     if (!forumPost) {
//       forumPost = { 
//         question: post.post_content, 
//         comments: [] 
//       };
//       forum.posts.push(forumPost);
//     }

//     // Add the comment to the post
//     if (post.comment_id) {
//       forumPost.comments.push(post.comment_content);
//     }
//   });

//   return forums; // Return the formatted forums data
// }

// // Add other functions like getForumById, addComment, etc.

// module.exports = {
//   getAllForums
// };
