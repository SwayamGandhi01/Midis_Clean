// controllers/dashboardController.js
const User = require('../models/User');

exports.getDashboardStats = async (req, res) => {
  try {
    // Users registered per month
    const currentYear = new Date().getFullYear();
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

    // Role distribution
    const roleCounts = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);

    const roleDistribution = {};
    roleCounts.forEach(role => {
      roleDistribution[role._id] = role.count;
    });

    res.json({ monthlyUsers, roleDistribution });
  } catch (err) {
    console.error('Error getting dashboard stats:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
