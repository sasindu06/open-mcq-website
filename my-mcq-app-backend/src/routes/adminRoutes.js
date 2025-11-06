// src/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware.js');
const { admin } = require('../middleware/adminMiddleware.js');

// --- Import ALL controller functions ---
const {
  // Question functions
  addQuestion, getAllQuestions, getQuestionById, updateQuestion, deleteQuestion,
  // User functions
  getUsers, getUserById, updateUser, deleteUser,
  // Stats function
  getAdminDashboardStats,
} = require('../controllers/adminController.js');
// ------------------------------------

// --- Admin Dashboard Stats Route ---
// Base: /api/admin/stats
router.route('/stats')
    .get(protect, admin, getAdminDashboardStats);
// ---------------------------------

// --- Question Management Routes ---
// Base: /api/admin/questions
router.route('/questions')
    .get(protect, admin, getAllQuestions)
    .post(protect, admin, addQuestion);

router.route('/questions/:id')
    .get(protect, admin, getQuestionById)
    .put(protect, admin, updateQuestion)
    .delete(protect, admin, deleteQuestion);
// ---------------------------------


// --- User Management Routes ---
// Base: /api/admin/users
router.route('/users') // Path relative to /api/admin
    .get(protect, admin, getUsers); // GET handler for listing users

router.route('/users/:id') // Path relative to /api/admin
    .get(protect, admin, getUserById)    // GET single user
    .put(protect, admin, updateUser)    // PUT update user
    .delete(protect, admin, deleteUser); // DELETE user
// -----------------------------


module.exports = router;