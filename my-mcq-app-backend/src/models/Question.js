// src/models/Question.js
const mongoose = require('mongoose');

// --- Define a type for options that can be text or image ---
const optionSchema = new mongoose.Schema({
  text: { type: String, trim: true },
  imageUrl: { type: String, trim: true },
}, { _id: false }); // No separate _id for each option subdocument

// Validate that either text or imageUrl is present, but not both
optionSchema.pre('validate', function(next) {
  if (this.text && this.text.trim() && this.imageUrl && this.imageUrl.trim()) {
    next(new Error('Option cannot have both text and an imageUrl.'));
  } else if (!this.text && !this.imageUrl) {
    // Allow empty options for flexibility in the admin panel, validation is in the controller
    next();
  } else {
    next();
  }
});
// ---------------------------------------------------------------

const questionSchema = new mongoose.Schema({
  grade: { type: String, required: [true, 'Grade/Level is required'] },
  subject: { type: String, required: [true, 'Subject is required'] },
  year: { type: Number, required: [true, 'Year is required'] },
  question: { type: String, required: [true, 'Question text is required'] },

  // --- UPDATED: Use the new optionSchema ---
  options: {
    type: [optionSchema], // Array of our new option type
    required: true,
    validate: [
      // --- THIS IS THE CHANGE ---
      { 
        validator: (val) => val.length === 4 || val.length === 5, 
        msg: 'Each question must have 4 or 5 options.' 
      },
      // --------------------------
    ]
  },
  // ------------------------------------------

  // --- UPDATED: Correct answer validation ---
  correctAnswer: {
    type: String, 
    required: [true, 'Correct answer identifier is required'],
    validate: {
        validator: function(value) {
            // --- THIS IS THE FIX ---
            // Check if the 'value' exists as 'text' OR 'imageUrl' in any of the options
            return this.options && this.options.some(opt => 
                (opt.text === value) || (opt.imageUrl === value)
            );
            // -----------------------
        },
        message: props => `Correct answer "${props.value}" must match the text or imageUrl of one of the provided options.`
    }
  },
  // ------------------------------------------------------------

  contextImageUrl: { type: String, trim: true, default: null },
  contextText: { type: String, trim: true, default: null },
}, {
  timestamps: true,
});

questionSchema.index({ grade: 1, subject: 1, year: 1 });

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;