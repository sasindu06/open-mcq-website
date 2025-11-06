// src/server.js

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db.js');

// Route imports
const authRoutes = require('./routes/authRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const paperRoutes = require('./routes/paperRoutes.js');
const attemptRoutes = require('./routes/attemptRoutes.js');
const adminRoutes = require('./routes/adminRoutes.js');

// Middleware imports
const { notFound, errorHandler } = require('./middleware/errorHandler.js');

// Load environment variables
dotenv.config();

// Connect to the database
connectDB();

const app = express();

// --- CORS Configuration (with all your Vercel URLs) ---
const allowedOrigins = [
  'http://localhost:3000', // For local development
  'https://my-mcq-app-frontend.vercel.app',
  'https://open-mcq-eosin.vercel.app',
  'https://open-qhxvmjo2m-sasindu-liyanages-projects.vercel.app'
  // Add any new Vercel URLs here if they change
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));
// --------------------------------------------------

app.use(express.json()); // Allow the app to accept JSON data

// --- NEW HEALTH CHECK ROUTE ---
// This is for Uptime Robot to keep the server awake
app.get('/api/health', (req, res) => {
  res.status(200).send('OK');
});
// ------------------------------

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/admin', adminRoutes);

// --- Fallback Middleware (Error Handling) ---
app.use(notFound);
app.use(errorHandler);

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
