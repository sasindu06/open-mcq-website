// src/routes/attemptRoutes.js
const express = require('express');
const router = express.Router();
// --- UPDATE the import to include getAttemptDetails ---
const { submitAttempt, getAttemptDetails } = require('../controllers/attemptController.js');
const { protect } = require('../middleware/authMiddleware.js');

// Submit an attempt
router.post('/submit', protect, submitAttempt);

// --- ADD THIS NEW ROUTE ---
// Get details for a specific attempt (needs ID in URL)
router.get('/:id', protect, getAttemptDetails); // :id makes it a URL parameter

module.exports = router;