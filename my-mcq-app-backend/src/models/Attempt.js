// src/models/Attempt.js
const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  grade: { // <-- CHANGED from 'level' to 'grade'
    type: String,
    // enum: ['O/L (Ordinary Level)', 'A/L (Advanced Level)'], // Optional: Keep or remove enum as needed
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  answers: [{
      questionId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Question' },
      userAnswer: { type: String /* required: true */ }, // <-- Temporarily remove 'required' OR change controller
  }],
  score: {
    type: Number,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});

const Attempt = mongoose.model('Attempt', attemptSchema);

module.exports = Attempt;