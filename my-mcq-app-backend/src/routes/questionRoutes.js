const express = require('express');
const router = express.Router();
const { addQuestion, getSpecificPaper } = require('../controllers/questionController');
const { protect } = require('../middleware/authMiddleware');

// Add a new question
router.post('/', protect, addQuestion);

// Get a specific paper using query parameters
router.get('/', getSpecificPaper);

module.exports = router;