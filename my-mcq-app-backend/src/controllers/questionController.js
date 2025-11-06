const Question = require('../models/Question');

// (The 'addQuestion' function remains the same)
const addQuestion = async (req, res) => {
  const { level, subject, year, questionText, options, correctAnswer } = req.body;
  try {
    if (!options.includes(correctAnswer)) {
      return res.status(400).json({ message: 'The correct answer must be one of the provided options.' });
    }
    const question = new Question({ level, subject, year, questionText, options, correctAnswer });
    const createdQuestion = await question.save();
    res.status(201).json(createdQuestion);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


/**
 * @desc    Get all questions for a specific paper
 * @route   GET /api/questions
 * @access  Public
 */
const getSpecificPaper = async (req, res) => {
  try {
    // Get data from query parameters (e.g., ?level=O/L&subject=Physics&year=2022)
    const { level, subject } = req.query;
    const year = parseInt(req.query.year, 10);

    if (!level || !subject || isNaN(year)) {
      return res.status(400).json({ message: 'Please provide level, subject, and year.' });
    }
    
    const questions = await Question.find({ level, subject, year });

    if (questions.length === 0) {
      return res.status(404).json({ message: `No paper found for ${level} ${subject} ${year}`});
    }
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  addQuestion,
  getSpecificPaper,
};