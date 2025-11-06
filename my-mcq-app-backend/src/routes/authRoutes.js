// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
// Ensure this import is correct
const { registerUser, loginUser } = require('../controllers/authController');

// Ensure the variable names match the import
router.post('/register', registerUser);
router.post('/login', loginUser);

module.exports = router;