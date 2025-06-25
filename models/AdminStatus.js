const mongoose = require('mongoose');

const adminStatusSchema = new mongoose.Schema({
  online: { type: Boolean, default: false }
});

module.exports = mongoose.model('AdminStatus', adminStatusSchema);
