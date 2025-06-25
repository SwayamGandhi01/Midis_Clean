const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ✅ Login Controller
exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', email);

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 🔒 Block admin login if not yet approved
    if (user.requestedAdmin && !user.isApprovedAdmin) {
      return res.status(403).json({
        message: 'Admin access not yet approved. Please wait for the main admin to approve your request.'
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error loading users' });
  }
};

// ✅ Create new user (relies on pre-save hashing)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

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

    res.status(201).json({
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
    res.status(500).json({ message: 'Server error creating user' });
  }
};

// ✅ Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, password } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ message: 'Name, email, and role are required' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.email !== email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ message: 'Email already exists' });
    }

    user.name = name;
    user.email = email;
    user.role = role;

    if (password && password.trim() !== '') {
      user.password = password;
    }

    await user.save();
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error updating user' });
  }
};

// ✅ Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error deleting user' });
  }
};
