// src/controllers/paperController.js

const Question = require('../models/Question.js');
const Attempt = require('../models/Attempt.js');

/**
 * @desc    Get available paper filter options (grades, subjects, years)
 * @route   GET /api/papers/filters
 * @access  Private
 */
const getPaperFilters = async (req, res) => {
  try {
    // 1. Extract filters from the request URL (e.g., ?grade=O/L&subject=Maths)
    const { grade, subject } = req.query;

    // --- A. GRADES ---
    // Always fetch all grades so the first dropdown is always populated
    const grades = await Question.distinct('grade').sort();

    // --- B. SUBJECTS ---
    // If a grade is selected, only show subjects belonging to that grade
    let subjectQuery = {};
    if (grade) {
      subjectQuery.grade = grade;
    }
    // logic: Find questions matching the grade, then get their distinct subjects
    const subjects = await Question.find(subjectQuery).distinct('subject');
    subjects.sort(); // Sort alphabetically

    // --- C. YEARS ---
    // If grade AND subject are selected, only show years for that specific paper
    let yearQuery = {};
    if (grade) {
      yearQuery.grade = grade;
    }
    if (subject) {
      yearQuery.subject = subject;
    }
    // logic: Find questions matching grade & subject, then get distinct years
    const years = await Question.find(yearQuery).distinct('year');
    years.sort((a, b) => b - a); // Sort numerically descending (newest first)

    // Debug logs to verify it's working (Optional)
    // console.log(`Filters requested - Grade: ${grade}, Subject: ${subject}`);
    // console.log(`Returning - Grades: ${grades.length}, Subjects: ${subjects.length}, Years: ${years.length}`);

    res.json({ years, subjects, grades });
  } catch (error) {
    console.error('Error fetching paper filters:', error);
    res.status(500).json({ message: 'Server Error fetching filters' });
  }
};

/**
 * @desc    Start a new paper attempt: find questions, create Attempt document
 * @route   POST /api/papers/start
 * @access  Private
 */
const startPaper = async (req, res) => {
  const userId = req.user._id;
  const { grade, subject, year } = req.body;

  // Basic validation
  if (!grade || !subject || !year) {
    return res.status(400).json({ message: 'Grade, Subject, and Year are required.' });
  }

  const queryYear = parseInt(year, 10);

  const queryCriteria = {
    grade: grade,
    subject: subject,
    year: queryYear
  };

  try {
    // Find questions matching the exact criteria
    const questions = await Question.find(queryCriteria)
                                    .select('_id question options');

    if (!questions || questions.length === 0) {
      return res.status(404).json({ message: 'No paper found for this selection.' });
    }

    // Prepare answers array structure
    const initialAnswers = questions.map(q => ({
      questionId: q._id,
      userAnswer: ''
    }));

    const newAttempt = new Attempt({
      user: userId,
      grade: grade,
      subject: subject,
      year: queryYear,
      answers: initialAnswers,
      score: 0,
      totalQuestions: questions.length
    });

    const savedAttempt = await newAttempt.save();

    res.status(201).json({
      message: 'Attempt started successfully!',
      attemptId: savedAttempt._id,
      questions: questions
    });

  } catch (error) {
    console.error('Error starting paper:', error);
    res.status(500).json({ message: 'Server Error starting paper' });
  }
};

module.exports = {
  getPaperFilters,
  startPaper,
};