const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const User = require('../models/User');
const ContactMessage = require('../models/ContactMessage'); // Only if you're counting messages

router.get('/stats', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    // Get monthly user registrations
    const monthlyUsers = Array(12).fill(0);
    const users = await User.find({
      createdAt: {
        $gte: new Date(`${currentYear}-01-01`),
        $lte: new Date(`${currentYear}-12-31`)
      }
    });

    users.forEach(user => {
      const month = new Date(user.createdAt).getMonth(); // 0 = Jan
      monthlyUsers[month]++;
    });

    // Get user role distribution
    const roleCounts = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);
    const roleDistribution = {};
    roleCounts.forEach(role => {
      roleDistribution[role._id] = role.count;
    });

    // Optional: message stats (if you use ContactMessage model)
    const messages = await ContactMessage.find({
      createdAt: {
        $gte: new Date(`${currentYear}-01-01`)
      }
    });

    const monthlyMessages = Array(12).fill(0);
    messages.forEach(msg => {
      const month = new Date(msg.createdAt).getMonth();
      monthlyMessages[month]++;
    });

    res.json({
      monthlyUsers,
      roleDistribution,
      monthlyMessages // Optional
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load stats' });
  }
});

module.exports = router;
