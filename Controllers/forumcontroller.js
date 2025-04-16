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
                {
                  id: 101,
                  content: 'Practice in aim trainers like Aim Lab.',
                  author: 'GameMaster',
                  date: new Date('2025-04-10')
                },
                {
                  id: 102,
                  content: 'Adjust your mouse DPI and sensitivity settings.',
                  author: 'ProGamer123',
                  date: new Date('2025-04-11')
                }
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
                {
                  id: 201,
                  content: 'It depends on your playstyle, Vagabond is good for beginners.',
                  author: 'SoulsVeteran',
                  date: new Date('2025-04-09')
                },
                {
                  id: 202,
                  content: 'Astrologer is great if you like magic.',
                  author: 'WizardFan',
                  date: new Date('2025-04-12')
                }
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
                {
                  id: 301,
                  content: 'Focus on objectives, not just kills.',
                  author: 'TopLaner',
                  date: new Date('2025-04-08')
                },
                {
                  id: 302,
                  content: 'Warding and vision control is key!',
                  author: 'SupportMain',
                  date: new Date('2025-04-10')
                }
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
                {
                  id: 401,
                  content: 'M4A1 and MP5 are a great combo.',
                  author: 'WarzonePlayer',
                  date: new Date('2025-04-05')
                },
                {
                  id: 402,
                  content: 'Use Ghost and High Alert perks.',
                  author: 'Sniper42',
                  date: new Date('2025-04-09')
                }
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
                {
                  id: 501,
                  content: 'Difficulty settings should be standard in all games.',
                  author: 'CasualGamer',
                  date: new Date('2025-04-07')
                },
                {
                  id: 502,
                  content: 'Live-service games are ruining single-player experiences.',
                  author: 'StoryModeEnjoyer',
                  date: new Date('2025-04-12')
                }
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

    // Get user ID from session if user is logged in
    let userId = 1; // Default to user ID 1 if no user is logged in
    
    if (req.session && req.session.loggedIn && req.session.user) {
      // Try to get user ID from various possible properties in the session
      if (req.session.user.id) {
        userId = req.session.user.id;
      } else if (req.session.user.user_id) {
        userId = req.session.user.user_id;
      }
      
      console.log('User logged in, associating comment with user ID:', userId);
      console.log('Full user session data:', req.session.user);
    } else {
      console.log('Using default user ID for comment:', userId);
    }
    
    // Add the comment to the database (never send null for user_id)
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