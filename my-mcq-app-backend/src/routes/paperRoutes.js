// src/routes/paperRoutes.js

const express = require('express');
const router = express.Router();
const { getPaperFilters, startPaper } = require('../controllers/paperController.js'); // 1. Import startPaper
const { protect } = require('../middleware/authMiddleware.js');

// This is your existing route
router.route('/filters').get(protect, getPaperFilters);

// --- 2. ADD THIS NEW ROUTE ---
router.route('/start').post(protect, startPaper);

module.exports = router;