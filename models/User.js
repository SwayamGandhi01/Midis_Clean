const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isApprovedAdmin: { type: Boolean, default: false },       // ✅ NEW FIELD
  requestedAdmin: { type: Boolean, default: false }          // ✅ NEW FIELD
}, { timestamps: true });

// Hash password before saving the user document
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Hash password if updated via findOneAndUpdate
userSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();

  // Password might be inside $set or directly in update object
  const password = update.password || (update.$set && update.$set.password);

  if (!password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (update.password) {
      update.password = hashedPassword;
    } else if (update.$set) {
      update.$set.password = hashedPassword;
    }

    next();
  } catch (err) {
    next(err);
  }
});

// Compare candidate password with stored hashed password
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
