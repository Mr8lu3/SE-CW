// Controllers/forumcontroller.js
const ForumModel = require('../Models/forummodel');
const CommentModel = require('../Models/commentmodel');

// Get all forums for display on the Forum page
async function getAllForums(req, res) {
  try {
    // Get forums from the database if possible
    let forums;
    
    try {
      forums = await ForumModel.getAllForums();
    } catch (dbError) {
      console.error('Database error fetching forums:', dbError);
      
      // If database fetch fails, use mock data as fallback
      forums = [
        {
          id: 1,
          title: '🎮 General Gaming Discussion',
          tags: ['fps', 'reaction-time', 'opinions'],
          posts: [
            {
              question: 'How do you improve your reaction time in FPS games?',
              comments: [
                'Practice in aim trainers like Aim Lab.',
                'Adjust your mouse DPI and sensitivity settings.'
              ]
            }
          ]
        },
        {
          id: 2,
          title: '🕹️ RPG Strategies & Builds',
          tags: ['rpg', 'builds'],
          posts: [
            {
              question: 'What is the best starting class in Elden Ring?',
              comments: [
                'It depends on your playstyle, Vagabond is good for beginners.',
                'Astrologer is great if you like magic.'
              ]
            }
          ]
        },
        {
          id: 3,
          title: '⚔️ Multiplayer & Co-op Tips',
          tags: ['multiplayer', 'teamwork'],
          posts: [
            {
              question: 'How do you carry a team in League of Legends?',
              comments: [
                'Focus on objectives, not just kills.',
                'Warding and vision control is key!'
              ]
            }
          ]
        },
        {
          id: 4,
          title: '🔫 FPS Tactics & Strategies',
          tags: ['strategy', 'fps'],
          posts: [
            {
              question: 'Best loadouts for Call of Duty Warzone?',
              comments: [
                'M4A1 and MP5 are a great combo.',
                'Use Ghost and High Alert perks.'
              ]
            }
          ]
        },
        {
          id: 5,
          title: '🥊 Controversial gaming opinion',
          tags: ['gaming', 'opinions'],
          posts: [
            {
              question: 'What\'s your most controversial gaming opinion?',
              comments: [
                'Difficulty settings should be standard in all games.',
                'Live-service games are ruining single-player experiences.'
              ]
            }
          ]
        }
      ];
    }
    
    res.render('Forum', { 
      forums: forums,
      user: req.session?.user || null
    });
  } catch (error) {
    console.error('Error in getAllForums:', error);
    res.status(500).render('error', { error: 'Failed to retrieve forums' });
  }
}

// Get a specific forum by ID
async function getForumById(req, res) {
  try {
    const forumId = req.params.id;
    const forum = await ForumModel.getForumById(forumId);
    
    if (!forum) {
      return res.status(404).render('error', { error: 'Forum not found' });
    }
    
    res.render('forum_detail', { forum: forum });
  } catch (error) {
    console.error('Error fetching forum:', error);
    res.status(500).render('error', { error: 'Failed to retrieve forum details' });
  }
}

// Add a comment to a forum post
async function addComment(req, res) {
  try {
    console.log('Received comment submission:', req.body);
    const { post_id, content } = req.body;
    
    if (!post_id || !content) {
      console.error('Missing required fields:', { post_id, content });
      return res.status(400).json({ 
        success: false, 
        message: 'Post ID and comment content are required' 
      });
    }

    // TESTING: Use a fixed user ID (1) for all comments instead of session
    const userId = 1; // Using user ID 1 for testing
    
    // Add the comment to the database
    const result = await CommentModel.addComment(post_id, content, userId);
    console.log('Comment added successfully:', result);
    
    // Return success response
    return res.json({ 
      success: true, 
      message: 'Comment added successfully',
      commentId: result.insertId
    });
  } catch (error) {
    console.error('Error adding comment:', error.message);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to add comment' 
    });
  }
}

module.exports = {
  getAllForums,
  getForumById,
  addComment
};