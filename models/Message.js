const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  userId: String,
  userName: String, // ✅ Added to store user's name
  sender: String,   // 'user', 'admin', 'bot'
  message: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
