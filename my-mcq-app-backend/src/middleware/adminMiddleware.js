// src/middleware/adminMiddleware.js

// Middleware to check if the user is an admin
const admin = (req, res, next) => {
  // Assumes the 'protect' middleware has already run and attached req.user
  if (req.user && req.user.role === 'admin') {
    next(); // User is admin, proceed to the next middleware/controller
  } else {
    res.status(403); // Forbidden
    throw new Error('Not authorized as an admin');
  }
};

module.exports = { admin };