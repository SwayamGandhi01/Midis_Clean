const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// ✅ Get all chat threads (latest message per user)
router.get('/threads', async (req, res) => {
  try {
    const threads = await Message.aggregate([
      { $sort: { timestamp: 1 } },
      {
        $group: {
          _id: '$userId',
          userName: { $last: '$userName' },
          lastMessage: { $last: '$message' },
          lastSender: { $last: '$sender' },
          lastTimestamp: { $last: '$timestamp' }
        }
      },
      { $sort: { lastTimestamp: -1 } }
    ]);

    const formatted = threads.map(t => ({
      userId: t._id,
      userName: t.userName && t.userName.trim() !== '' 
        ? t.userName 
        : `User ${t._id.toString().slice(-4)}`,
      lastMessage: t.lastMessage,
      lastSender: t.lastSender,
      lastTimestamp: t.lastTimestamp
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error('[GET /threads] Error:', error);
    res.status(500).json({ message: 'Error fetching threads', error: error.message });
  }
});

// ✅ Get full chat history with a specific user
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await Message.find({ userId }).sort({ timestamp: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error(`[GET /history/${req.params.userId}] Error:`, error);
    res.status(500).json({ message: 'Error fetching chat history', error: error.message });
  }
});

// ✅ Get all unique users (for sidebar display etc.)
router.get('/users', async (req, res) => {
  try {
    const users = await Message.aggregate([
      {
        $group: {
          _id: '$userId',
          userName: { $last: '$userName' }
        }
      }
    ]);

    const formatted = users.map(u => ({
      userId: u._id,
      userName: u.userName && u.userName.trim() !== '' 
        ? u.userName 
        : `User ${u._id.toString().slice(-4)}`
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error('[GET /users] Error:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

module.exports = router;
