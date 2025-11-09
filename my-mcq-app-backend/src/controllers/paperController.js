// src/controllers/paperController.js

const Question = require('../models/Question.js');
const Attempt = require('../models/Attempt.js'); // Assuming you'll use this later

/**
 * @desc    Get available paper filter options (grades, subjects, years)
 * This is now dynamic based on query parameters.
 * @route   GET /api/papers/filters
 * @access  Private (Assumes user must be logged in to see options)
 */
const getPaperFilters = async (req, res) => {
  // Check for query parameters from the frontend
  const { grade, subject } = req.query;

  try {
    // 1. If no query params, just send the distinct grades.
    if (!grade && !subject) {
      const grades = await Question.distinct('grade').sort();
      // Send empty arrays for subjects and years; frontend will ask for them later.
      res.json({ grades, subjects: [], years: [] });
    } 
    // 2. If a 'grade' is provided, send the distinct subjects *for that grade*.
    else if (grade && !subject) {
      const filterCriteria = { grade: grade };
      const subjects = await Question.distinct('subject', filterCriteria).sort();
      res.json({ subjects, years: [] }); // Send only subjects
    } 
    // 3. If 'grade' AND 'subject' are provided, send the distinct years *for that combination*.
    else if (grade && subject) {
      const filterCriteria = { grade: grade, subject: subject };
      const years = await Question.distinct('year', filterCriteria).sort({ year: -1 });
      res.json({ years }); // Send only years
    } 
    // Handle any invalid combination of query params
    else {
      res.status(400).json({ message: 'Invalid filter query combination' });
    }

  } catch (error) {
    console.error('Error fetching paper filters:', error);
    res.status(500).json({ message: 'Server Error fetching filters' });
  }
};

/**
 * @desc    Start a new paper attempt: find questions, create Attempt document
 * @route   POST /api/papers/start
 * @access  Private
 * (This function is identical to V1)
 */
const startPaper = async (req, res) => {
  const userId = req.user._id; // Get user ID from authenticated request (provided by 'protect' middleware)
  const { grade, subject, year } = req.body; // Use 'grade' from request body

  // --- Log received request body ---
  console.log("Received request body for /papers/start:", req.body);
  // ---------------------------------

  // Basic validation
  if (!grade || !subject || !year) {
    console.log("Validation failed: Missing grade, subject, or year.");
    return res.status(400).json({ message: 'Grade, Subject, and Year are required.' });
  }

  const queryYear = parseInt(year, 10); // Ensure year is treated as a number

  // --- Log the exact query criteria ---
  const queryCriteria = {
    grade: grade,
    subject: subject,
    year: queryYear
  };
  console.log("Attempting to find paper with query criteria:", queryCriteria);
  // ------------------------------------

  try {
    // Find questions matching the exact criteria using the corrected field names
    // --- UPDATED: We now select contextImageUrl and contextText as well ---
    const questions = await Question.find(queryCriteria)
                                    .select('_id question options contextImageUrl contextText'); 
    // -----------------------------------------------------------------

    // Check if any questions were found
    if (!questions || questions.length === 0) {
      console.log('No questions found for the specified criteria:', queryCriteria);
      return res.status(404).json({ message: 'No paper found for this selection.' });
    }

    console.log(`Found ${questions.length} questions.`);

    // --- Create a new Attempt document ---
    // Prepare answers array structure (initially with empty string answers)
    const initialAnswers = questions.map(q => ({
      questionId: q._id,
      userAnswer: '' // Use empty string instead of null
    }));

    const newAttempt = new Attempt({
      user: userId,
      grade: grade,       // Save 'grade' to the attempt document
      subject: subject,
      year: queryYear,    // Save the numeric year
      answers: initialAnswers,
      score: 0,           // Initial score is 0
      totalQuestions: questions.length
      // timestamps will be added automatically by Mongoose
    });

    // Save the new attempt document to the database
    const savedAttempt = await newAttempt.save();
    console.log(`Created new attempt with ID: ${savedAttempt._id}`);

    // Send the attempt ID and the questions back to the frontend
    res.status(201).json({
      message: 'Attempt started successfully!',
      attemptId: savedAttempt._id,
      questions: questions // Send questions so frontend can display them
    });

  } catch (error) {
    // Log errors during the process
    console.error('Error starting paper:', error);
    console.error('Query Criteria at time of error:', queryCriteria); // Log criteria again on error
    res.status(5.00).json({ message: 'Server Error starting paper' });
  }
};

// --- THIS MUST BE AT THE VERY END OF THE FILE ---
module.exports = {
  getPaperFilters,
  startPaper,
};