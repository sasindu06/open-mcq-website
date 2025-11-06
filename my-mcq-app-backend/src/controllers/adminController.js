// src/controllers/adminController.js

const mongoose = require('mongoose');
const Question = require('../models/Question.js');
const User = require('../models/User.js');
const Attempt = require('../models/Attempt.js');

// --- Helper function to fix old data ---
const transformOptions = (options) => {
    if (!options || options.length === 0) return [];
    if (typeof options[0] === 'object' && options[0] !== null && (options[0].text !== undefined || options[0].imageUrl !== undefined)) {
        return options.map(opt => ({ text: opt.text || null, imageUrl: opt.imageUrl || null }));
    }
    if (typeof options[0] === 'string') {
        return options.map(optString => ({ text: optString, imageUrl: null }));
    }
    return [];
};
// ------------------------------------------

// --- Question Management Functions ---

/**
 * @desc    Admin: Add a new question (FIXED: Validates image answers)
 * @route   POST /api/admin/questions
 * @access  Private/Admin
 */
const addQuestion = async (req, res, next) => {
  const { grade, subject, year, question, options, correctAnswer, contextImageUrl, contextText } = req.body;

  if (!grade || !subject || !year || !question || !options || !correctAnswer) {
    return res.status(400).json({ message: 'Grade, Subject, Year, Question, Options array, and Correct Answer are required.' });
  }
  if (!Array.isArray(options) || options.length !== 4) {
      return res.status(400).json({ message: 'Options must be an array of 4 objects.' });
  }
  
  const invalidOption = options.find(opt => typeof opt !== 'object' || (!opt.text && !opt.imageUrl) || (opt.text && opt.imageUrl));
  if (invalidOption) {
       return res.status(400).json({ message: 'Each option must be an object with EITHER "text" OR "imageUrl", but not both.' });
  }
  
  // --- FIX: Check if correctAnswer matches EITHER text OR imageUrl ---
  const isValidCorrectAnswer = options.some(opt => (opt.text === correctAnswer) || (opt.imageUrl === correctAnswer));
  if (!isValidCorrectAnswer) {
    return res.status(400).json({ message: 'The correct answer must match the text or image URL of one of the provided options.' });
  }
  // -----------------------------------------------------------------

  try {
    const newQuestion = new Question({
      grade, subject, year: parseInt(year, 10), question,
      options: options.map(opt => ({ text: opt.text || null, imageUrl: opt.imageUrl || null })),
      correctAnswer, // This is now validated
      contextImageUrl: contextImageUrl || null,
      contextText: contextText || null,
    });
    const createdQuestion = await newQuestion.save();
    res.status(201).json(createdQuestion);
  } catch (error) {
    console.error('Error adding question:', error);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: "Validation failed", errors: messages });
    }
    next(new Error('Server Error adding question'));
  }
};

/**
 * @desc    Admin: Get questions (Transforms old data)
 * @route   GET /api/admin/questions
 * @access  Private/Admin
 */
const getAllQuestions = async (req, res, next) => {
    try {
        const filter = {};
        if (req.query.grade) filter.grade = req.query.grade;
        if (req.query.subject) filter.subject = req.query.subject;
        if (req.query.year) {
            const yearNum = parseInt(req.query.year, 10);
            if (!isNaN(yearNum)) filter.year = yearNum;
        }
        console.log("Fetching questions with filter:", filter);
        const questions = await Question.find(filter).sort({ year: -1, subject: 1, createdAt: 1 }).lean();
        
        const transformedQuestions = questions.map(q => ({
            ...q,
            options: transformOptions(q.options)
        }));
        res.json(transformedQuestions);
    } catch (error) {
        console.error('Error fetching all questions:', error);
        next(new Error('Server Error fetching questions'));
    }
};

/**
 * @desc    Admin: Get a single question by ID (Transforms old data)
 * @route   GET /api/admin/questions/:id
 * @access  Private/Admin
 */
const getQuestionById = async (req, res, next) => {
    try {
        const question = await Question.findById(req.params.id).lean();
        if (question) {
            const transformedQuestion = {
                ...question,
                options: transformOptions(question.options)
            };
            res.json(transformedQuestion);
        } else {
            res.status(404).json({ message: 'Question not found' });
        }
    } catch (error) {
        console.error('Error fetching question by ID:', error);
         if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid Question ID format.' });
        next(new Error('Server Error fetching question'));
    }
};

/**
 * @desc    Admin: Update a question by ID (FIXED: Validates image answers)
 * @route   PUT /api/admin/questions/:id
 * @access  Private/Admin
 */
const updateQuestion = async (req, res, next) => {
    const { grade, subject, year, question, options, correctAnswer, contextImageUrl, contextText } = req.body;
    const questionId = req.params.id;

     if (!grade || !subject || !year || !question || !options || !correctAnswer) { return res.status(400).json({ message: 'All fields required.' }); }
     if (!Array.isArray(options) || options.length !== 4) { return res.status(400).json({ message: 'Options must be an array of 4 objects.' }); }
     const invalidOption = options.find(opt => typeof opt !== 'object' || (!opt.text && !opt.imageUrl) || (opt.text && opt.imageUrl));
     if (invalidOption) { return res.status(400).json({ message: 'Each option must be an object with EITHER "text" OR "imageUrl", but not both.' }); }

     // --- FIX: Check if correctAnswer matches EITHER text OR imageUrl ---
     const isValidCorrectAnswer = options.some(opt => (opt.text === correctAnswer) || (opt.imageUrl === correctAnswer));
     if (!isValidCorrectAnswer) {
        return res.status(400).json({ message: 'The correct answer must match the text or image URL of one of the provided options.' });
     }
     // -----------------------------------------------------------------

    try {
        const existingQuestion = await Question.findById(questionId);
        if (!existingQuestion) { return res.status(404).json({ message: 'Question not found' }); }

        existingQuestion.grade = grade;
        existingQuestion.subject = subject;
        existingQuestion.year = parseInt(year, 10);
        existingQuestion.question = question;
        existingQuestion.options = options.map(opt => ({ text: opt.text || null, imageUrl: opt.imageUrl || null }));
        existingQuestion.correctAnswer = correctAnswer; // Save the validated answer
        existingQuestion.contextImageUrl = contextImageUrl || null;
        existingQuestion.contextText = contextText || null;

        const updatedQuestion = await existingQuestion.save();
        res.json(updatedQuestion);

    } catch (error) {
        console.error('Error updating question:', error);
        if (error.name === 'ValidationError') { /* ... */ }
        if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid Question ID format.' });
        next(new Error('Server Error updating question'));
    }
};

/**
 * @desc    Admin: Delete a question by ID
 * @route   DELETE /api/admin/questions/:id
 * @access  Private/Admin
 */
const deleteQuestion = async (req, res, next) => {
    // ... (This function is unchanged)
    const questionId = req.params.id;
    try {
        const question = await Question.findById(questionId);
        if (!question) return res.status(404).json({ message: 'Question not found' });
        const result = await Question.deleteOne({ _id: questionId });
        if (result.deletedCount === 1) res.json({ message: 'Question removed' });
        else res.status(404).json({ message: 'Question not found during delete' });
    } catch (error) {
        console.error('Error deleting question:', error);
        if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid Question ID format.' });
        next(new Error('Server Error deleting question'));
    }
};

// --- User Management Functions (Unchanged) ---
const getUsers = async (req, res, next) => { /* ... (unchanged) ... */ 
    console.log(`[${new Date().toISOString()}] --- Executing getUsers ---`);
    try {
        console.time('[Admin Users] User.find Query');
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        console.timeEnd('[Admin Users] User.find Query');
        console.log(`[${new Date().toISOString()}] Found ${users.length} users.`);
        res.json(users);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error in getUsers:`, error);
        next(new Error('Server Error fetching users'));
    } finally {
        console.log(`[${new Date().toISOString()}] --- Finished getUsers ---`);
    }
};
const getUserById = async (req, res, next) => { /* ... (unchanged) ... */ 
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid User ID format.' });
        next(new Error('Server Error fetching user'));
    }
};
const updateUser = async (req, res, next) => { /* ... (unchanged, but still has 'name' bug) ... */ 
    const userId = req.params.id;
    const { name, email, role } = req.body;
    if (!name || !email || !role) return res.status(400).json({ message: 'Name, email, role required.' });
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role.' });
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        // Note: 'name' is still not in your User model, but I'll leave your original logic.
        user.name = name; 
        user.email = email; 
        user.role = role;
        
        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email,
            role: updatedUser.role, award: updatedUser.award, birthday: updatedUser.birthday,
            school: updatedUser.school, district: updatedUser.district,
        });
    } catch (error) {
        console.error('Error updating user:', error);
        if (error.code === 11000) return res.status(400).json({ message: 'Email already in use.' });
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: "Validation failed", errors: messages });
        }
        if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid User ID format.' });
        next(new Error('Server Error updating user'));
    }
};
const deleteUser = async (req, res, next) => { /* ... (unchanged) ... */ 
    const userId = req.params.id;
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user._id.toString() === req.user._id.toString()) return res.status(400).json({ message: 'Cannot delete self.' });
        const result = await User.deleteOne({ _id: userId });
        if (result.deletedCount === 1) {
            res.json({ message: 'User removed' });
        } else { res.status(404).json({ message: 'User not found during delete' }); }
    } catch (error) {
        console.error('Error deleting user:', error);
        if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid User ID format.' });
        next(new Error('Server Error deleting user'));
    }
};

// --- Admin Dashboard Stats Function (Corrected 'name' aggregation) ---
const getAdminDashboardStats = async (req, res, next) => {
    // ... (This function is unchanged from the last fix) ...
    const timeframe = req.query.timeframe || 'daily';
    let startDate; const now = new Date();
    switch (timeframe) {
        case 'monthly': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
        case 'quarterly':
             const threeMonthsAgoMonth = now.getMonth() - 3;
             const threeMonthsAgoYear = now.getFullYear() + Math.floor(threeMonthsAgoMonth / 12);
             const adjustedMonth = (threeMonthsAgoMonth % 12 + 12) % 12;
             startDate = new Date(threeMonthsAgoYear, adjustedMonth, 1); break;
        case 'yearly': startDate = new Date(now.getFullYear(), 0, 1); break;
        case 'daily': default: startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
    }
    const endDate = new Date();
    console.log(`[Admin Stats] Calculating for timeframe: ${timeframe}, Start: ${startDate.toISOString()}`);
    try {
        console.time(`[Admin Stats ${timeframe}] New Users`);
        const newUsersCount = await User.countDocuments({ createdAt: { $gte: startDate, $lt: endDate } });
        console.timeEnd(`[Admin Stats ${timeframe}] New Users`);

        console.time(`[Admin Stats ${timeframe}] Active Users`);
        const activeUserIds = await Attempt.distinct('user', { createdAt: { $gte: startDate, $lt: endDate } });
        const activeUsersCount = activeUserIds.length;
        console.timeEnd(`[Admin Stats ${timeframe}] Active Users`);

        console.time(`[Admin Stats ${timeframe}] Top Users`);
        const topUsers = await Attempt.aggregate([
            { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
            { $group: { _id: '$user', attemptCount: { $sum: 1 } } },
            { $sort: { attemptCount: -1 } }, { $limit: 5 },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userDetails' }},
            { $unwind: '$userDetails' },
            { $project: { 
                _id: 0, userId: '$_id', 
                name: { $concat: ["$userDetails.firstName", " ", "$userDetails.lastName"] }, // Corrected name
                attemptCount: 1 
            }}
        ]);
        console.timeEnd(`[Admin Stats ${timeframe}] Top Users`);

        res.json({ timeframe, startDate: startDate.toISOString().split('T')[0], newUsersCount, activeUsersCount, topUsers });
    } catch (error) {
        console.error(`[Admin Stats] Error for ${timeframe}:`, error);
        next(new Error('Server Error fetching dashboard stats'));
    }
};

// --- Export ALL functions ---
module.exports = {
  addQuestion, getAllQuestions, getQuestionById, updateQuestion, deleteQuestion,
  getUsers, getUserById, updateUser, deleteUser,
  getAdminDashboardStats,
};