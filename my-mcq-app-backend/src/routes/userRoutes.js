// src/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  getUserStats,
  getLeaderboard,
  getUserAttempts,
  clearUserAttempts, // <-- Import the new function
} = require('../controllers/userController.js');
const { protect } = require('../middleware/authMiddleware.js');

// Profile routes (protected)
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

// Stats route (protected)
router.route('/stats')
    // --- ADD LOG HERE ---
    .get((req, res, next) => {
        console.log(`[${new Date().toISOString()}] Received request for GET /api/users/stats`);
        next(); // Pass control to the next middleware (protect)
    }, protect, getUserStats);
    // --------------------

// Leaderboard route (public)
router.route('/leaderboard')
    .get(getLeaderboard); // <-- Corrected typo from getLeaderband

// Attempts route (protected)
router.route('/attempts')
     // --- GET LOG ---
    .get((req, res, next) => {
        console.log(`[${new Date().toISOString()}] Received request for GET /api/users/attempts`);
        next(); // Pass control to the next middleware (protect)
    }, protect, getUserAttempts)
     // --- NEW DELETE ROUTE ---
    .delete((req, res, next) => {
        console.log(`[${new Date().toISOString()}] Received request for DELETE /api/users/attempts`);
        next();
    }, protect, clearUserAttempts);
    // --------------------


module.exports = router;