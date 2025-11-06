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

// --- NEW DYNAMIC CORS CONFIGURATION ---
// This REPLACES your old 'allowedOrigins' array and 'app.use(cors(...))'
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like Postman, mobile apps, or curl)
    if (!origin) {
      return callback(null, true);
    }
    
    // Allow localhost for development and all .vercel.app domains for production/previews
    if (origin === 'http://localhost:3000' || origin.endsWith('.vercel.app')) {
      return callback(null, true); // Allowed
    } else {
      // Blocked by CORS
      return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'));
    }
  },
  credentials: true, // If you need to send cookies with requests
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
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
const PORT = process.DOCKER_PORT || process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));