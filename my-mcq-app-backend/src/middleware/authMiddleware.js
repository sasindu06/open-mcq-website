// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User.js'); // Assuming path is correct

const protect = async (req, res, next) => {
  // --- ADD LOG HERE ---
  console.log(`[${new Date().toISOString()}] Entered 'protect' middleware for path: ${req.originalUrl}`);
  // --------------------

  let token;

  // Check for the token in the authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (it's in the format "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];
      console.log(`[${new Date().toISOString()}] Token found, attempting verification...`);

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(`[${new Date().toISOString()}] Token verified. Decoded ID: ${decoded.id}`);

      // Find the user by the ID from the token and attach it to the request object
      // We exclude the password from the user object
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
          console.error(`[${new Date().toISOString()}] Error: User not found for token ID: ${decoded.id}`);
          // Explicitly throw an error or send response to prevent hanging
           res.status(401); // Unauthorized
           throw new Error('Not authorized, user not found for token');
           // return res.status(401).json({ message: 'Not authorized, user not found for token' });
      }

      console.log(`[${new Date().toISOString()}] User found and attached to request. Proceeding...`);
      next(); // Move to the next middleware or the route handler
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Token verification failed or user lookup failed:`, error.message);
      res.status(401); // Unauthorized
      // Send error details only in development
      const errorMessage = process.env.NODE_ENV === 'production' ? 'Not authorized, token failed' : `Not authorized: ${error.message}`;
      // Use next(error) to let the global error handler manage the response format
      next(new Error(errorMessage)); // Pass error to the next error handler
      // Or send JSON directly: res.status(401).json({ message: errorMessage });
    }
  }

  // Handle case where no token was found in the header
  if (!token) {
    console.log(`[${new Date().toISOString()}] No token found in Authorization header.`);
    res.status(401); // Unauthorized
    // Use next(error) for consistency with error handling
    next(new Error('Not authorized, no token'));
    // Or send JSON directly: res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };