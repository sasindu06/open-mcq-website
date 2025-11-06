// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // --- UPDATED FIELDS ---
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
  },
  // --- 'name' field is removed ---
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Please use a valid email address.'],
  },
  password: {
    type: String,
    required: true,
    minlength: [6, 'Password must be at least 6 characters long'],
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  award: {
    type: String,
    enum: ['None', 'Silver', 'Gold', 'Platinum'],
    default: 'None',
  },
  birthday: {
    type: Date,
    required: false,
  },
  school: {
    type: String,
    required: false,
    trim: true,
  },
  district: {
    type: String,
    required: false,
    trim: true,
  },
}, {
  timestamps: true,
  // --- Optional: Add a virtual 'name' field ---
  // This combines firstName and lastName automatically
  // when you access user.name
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('name').get(function() {
  return `${this.firstName} ${this.lastName}`;
});
// ---------------------------------------------

// Password hashing middleware (remains the same)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
  } catch (error) {
       next(error);
  }
});

// Password comparison method (remains the same)
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;