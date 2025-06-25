const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const userController = require('../controllers/userController');

const router = express.Router();

/** Middleware: Verify JWT token */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

/** Middleware: Only allow admins */
function authorizeAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

// -------------------- ROUTES --------------------

/** @route   POST /api/users/login */
router.post('/login', userController.login);

/** @route   POST /api/users */
router.post('/', async (req, res) => {
  let { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Name, email, password, and role are required' });
  }

  name = name.trim();
  email = email.trim().toLowerCase();
  password = password.trim();

  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role value. Must be user or admin.' });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const isFirstAdmin = role === 'admin' && (await User.countDocuments({ role: 'admin' })) === 0;

    const user = new User({
      name,
      email,
      password,
      role: isFirstAdmin ? 'admin' : 'user',
      isApprovedAdmin: isFirstAdmin,
      requestedAdmin: role === 'admin' && !isFirstAdmin
    });

    await user.save();

    return res.status(201).json({
      message: isFirstAdmin
        ? 'Main admin created successfully'
        : role === 'admin'
        ? 'Admin request submitted. Awaiting approval.'
        : 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApprovedAdmin: user.isApprovedAdmin,
        requestedAdmin: user.requestedAdmin
      }
    });
  } catch (err) {
    console.error('Error creating user:', err);
    return res.status(500).json({ message: 'Server error creating user' });
  }
});

/** @route   GET /api/users */
router.get('/', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error loading users' });
  }
});

/** @route   PUT /api/users/:id */
router.put('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  const { name, email, role, password } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ message: 'Name, email, and role are required' });
  }

  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role value. Must be user or admin.' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (email !== user.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: user._id } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use by another user' });
      }
    }

    user.name = name.trim();
    user.email = email.trim().toLowerCase();
    user.role = role;

    if (password && password.trim() !== '') {
      user.password = password.trim();
    }

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: 'Server error updating user' });
  }
});

/** @route   DELETE /api/users/:id */
router.delete('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

// ------------------- NEW ROUTES -------------------

/** @route   GET /api/users/pending-admins
 *  @desc    Get all users who requested admin access but are not yet approved
 */
router.get('/pending-admins', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const pendingAdmins = await User.find(
      { requestedAdmin: true, isApprovedAdmin: false },
      '-password'
    ).sort({ createdAt: -1 });

    res.json(pendingAdmins);
  } catch (err) {
    console.error('Error fetching pending admins:', err);
    res.status(500).json({ message: 'Server error fetching pending admin requests' });
  }
});

/** @route   POST /api/users/approve-admin/:id
 *  @desc    Approve a user's admin request
 */
router.post('/approve-admin/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.requestedAdmin || user.isApprovedAdmin) {
      return res.status(404).json({ message: 'Invalid admin request' });
    }

    user.role = 'admin';
    user.isApprovedAdmin = true;
    await user.save();

    res.json({ message: 'Admin approved successfully' });
  } catch (err) {
    console.error('Error approving admin:', err);
    res.status(500).json({ message: 'Server error approving admin' });
  }
});

module.exports = router;
