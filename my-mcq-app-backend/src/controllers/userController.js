// src/controllers/userController.js

const Attempt = require('../models/Attempt.js');
const User = require('../models/User.js');

// getUserProfile
const getUserProfile = async (req, res) => {
  try {
    // 1. Find the user by ID from the authenticated request
    // We select '-password' to exclude the hashed password from the result
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Send back the user's profile data
    // This will include firstName, lastName, email, etc.
    res.json(user);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in getUserProfile:`, error);
    res.status(500).json({ message: 'Server Error fetching profile' });
  }
};

// updateUserProfile
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 1. Get the fields to update from the request body
    const { firstName, lastName, email, birthday, school, district } = req.body;

    // 2. Update the user object with new values if they were provided
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    // Handle null/empty strings correctly
    user.birthday = birthday === undefined ? user.birthday : (birthday || null);
    user.school = school === undefined ? user.school : (school || null);
    user.district = district === undefined ? user.district : (district || null);

    // 3. Save the updated user object to the database
    const updatedUser = await user.save();

    // 4. Send back the updated user data (excluding password)
    res.json({
      id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      role: updatedUser.role,
      birthday: updatedUser.birthday,
      school: updatedUser.school,
      district: updatedUser.district,
      award: updatedUser.award,
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in updateUserProfile:`, error);
     if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: "Validation failed", errors: messages });
    }
    res.status(500).json({ message: 'Server Error updating profile' });
  }
};


/**
 * @desc    Get user dashboard statistics (with timing)
 * @route   GET /api/users/stats
 * @access  Private
 */
const getUserStats = async (req, res) => {
  console.log(`[${new Date().toISOString()}] --- Executing getUserStats ---`);
  try {
    const userId = req.user.id;

    // --- Time User Fetch ---
    console.time(`[Stats] Fetch User Award (${userId})`);
    const user = await User.findById(userId).select('award');
    console.timeEnd(`[Stats] Fetch User Award (${userId})`);
    const userAward = user ? user.award : 'None';
    // -----------------------

    // --- Time Attempts Fetch ---
    console.time(`[Stats] Fetch Attempts (${userId})`);
    // We need 'score', 'totalQuestions', and 'subject' for the new stats
    const userAttempts = await Attempt.find({ user: userId }).select('score totalQuestions subject');
    console.timeEnd(`[Stats] Fetch Attempts (${userId})`);
    // -------------------------

    console.log(`[${new Date().toISOString()}] Found ${userAttempts.length} attempts for stats calculation.`);

    // Calculations
    if (!userAttempts || userAttempts.length === 0) {
      // Return default stats if no attempts
      console.log(`[${new Date().toISOString()}] No attempts found. Sending default stats.`);
      return res.json({
        totalAttempts: 0,
        highestScore: '0 / 0',
        averageScore: '0.0%',
        rank: 'N/A',
        award: userAward,
        // --- NEW: Send default chart data ---
        scoreDistribution: { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 },
        subjectAverages: [],
        // ------------------------------------
      });
    }
    
    // --- Existing Calculations ---
    const totalAttempts = userAttempts.length;
    let highestScore = 0; 
    let highestTotalQuestions = 0; 
    let totalScoreSum = 0; 
    let totalQuestionsSum = 0;
    
    // --- NEW: Chart Data Calculations ---
    const gradeCounts = { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
    const subjectStats = {}; // e.g., { Physics: { totalScore: 0, totalQuestions: 0, count: 0 } }
    // ------------------------------------


    userAttempts.forEach(attempt => {
      // --- Existing ---
      totalScoreSum += attempt.score;
      totalQuestionsSum += attempt.totalQuestions;
      if (attempt.score > highestScore) {
        highestScore = attempt.score;
        highestTotalQuestions = attempt.totalQuestions;
      }
      // ----------------

      // --- NEW: Calculate percentage for score distribution ---
      let percentage = 0;
      if (attempt.totalQuestions > 0) {
          percentage = (attempt.score / attempt.totalQuestions) * 100;
      }

      if (percentage >= 90) gradeCounts['A']++;
      else if (percentage >= 80) gradeCounts['B']++;
      else if (percentage >= 70) gradeCounts['C']++;
      else if (percentage >= 60) gradeCounts['D']++;
      else gradeCounts['F']++;
      // --------------------------------------------------------

      // --- NEW: Aggregate data for subject averages ---
      if (!subjectStats[attempt.subject]) {
          subjectStats[attempt.subject] = { totalScore: 0, totalQuestions: 0, count: 0 };
      }
      subjectStats[attempt.subject].totalScore += attempt.score;
      subjectStats[attempt.subject].totalQuestions += attempt.totalQuestions;
      subjectStats[attempt.subject].count++;
      // ------------------------------------------------
    });

    // --- Existing ---
    const averagePercentage = totalQuestionsSum > 0 ? (totalScoreSum / totalQuestionsSum) * 100 : 0;
    const rank = 'N/A'; // Placeholder
    // ----------------

    // --- NEW: Format subject averages for chart ---
    const subjectAverages = Object.keys(subjectStats).map(subject => {
        const stats = subjectStats[subject];
        const average = stats.totalQuestions > 0 ? (stats.totalScore / stats.totalQuestions) * 100 : 0;
        return {
            subject: subject,
            average: parseFloat(average.toFixed(1)), // e.g., 85.2
            count: stats.count
        };
    });
    // --------------------------------------------

    console.log(`[${new Date().toISOString()}] Stats calculated. Sending response.`);
    res.json({
      // --- Existing ---
      totalAttempts,
      highestScore: `${highestScore} / ${highestTotalQuestions}`,
      averageScore: `${averagePercentage.toFixed(1)}%`,
      rank: rank,
      award: userAward,
      // --- NEW ---
      scoreDistribution: gradeCounts,
      subjectAverages: subjectAverages,
      // -----------
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in getUserStats:`, error);
    res.status(500).json({ message: 'Server Error fetching stats' });
  } finally {
      console.log(`[${new Date().toISOString()}] --- Finished getUserStats ---`);
  }
};


/**
 * @desc    Get user rankings/leaderboard (with timing)
 * @route   GET /api/users/leaderboard
 * @access  Public
 */
const getLeaderboard = async (req, res) => {
   console.log(`[${new Date().toISOString()}] --- Executing getLeaderboard ---`);
   try {
     // --- Time Aggregation Query ---
     console.time('[Leaderboard] Aggregate Query');
     const leaderboard = await Attempt.aggregate([
       // (Aggregation stages remain the same)
       { $group: { _id: '$user', totalScore: { $sum: '$score' }, totalQuestionsAttempted: { $sum: '$totalQuestions' }, numberOfAttempts: { $sum: 1 } } },
       { $project: { userId: '$_id', averageScore: { $cond: [ { $eq: ['$totalQuestionsAttempted', 0] }, 0, { $multiply: [{ $divide: ['$totalScore', '$totalQuestionsAttempted'] }, 100] } ] }, numberOfAttempts: 1, _id: 0 } },
       { $sort: { averageScore: -1, numberOfAttempts: 1 } },
       { $limit: 100 },
       { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'userDetails' } },
       { $unwind: '$userDetails' },

       // --- THIS IS THE FIX ---
       // We use $concat to combine the firstName and lastName fields into a single 'name' field
       { 
         $project: { 
           userId: 1, 
           name: { $concat: ["$userDetails.firstName", " ", "$userDetails.lastName"] }, 
           award: '$userDetails.award', 
           averageScore: 1 
         } 
       }
       // -----------------------

     ]);
     console.timeEnd('[Leaderboard] Aggregate Query');
     // ----------------------------
     console.log(`[${new Date().toISOString()}] Leaderboard generated with ${leaderboard.length} entries.`);
     res.json(leaderboard);
   } catch (error) {
      console.error(`[${new Date().toISOString()}] Error in getLeaderboard:`, error);
      res.status(500).json({ message: 'Server Error fetching leaderboard', error: error.message });
   } finally {
       console.log(`[${new Date().toISOString()}] --- Finished getLeaderboard ---`);
   }
};

/**
 * @desc    Get all attempts for the logged-in user (with timing)
 * @route   GET /api/users/attempts
 * @access  Private
 */
const getUserAttempts = async (req, res) => {
    console.log(`[${new Date().toISOString()}] --- Executing getUserAttempts ---`);
    try {
        const userId = req.user._id;

        // --- Time Attempts Find Query ---
        console.time(`[Attempts] Find Attempts (${userId})`);
        const attempts = await Attempt.find({ user: userId })
            .select('grade subject year score totalQuestions createdAt')
            .sort({ createdAt: -1 });
        console.timeEnd(`[Attempts] Find Attempts (${userId})`);
        // ------------------------------

        console.log(`[${new Date().toISOString()}] Found ${attempts.length} attempts for user.`);
        res.json(attempts);

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error in getUserAttempts:`, error);
        res.status(500).json({ message: 'Server Error fetching attempts' });
    } finally {
        console.log(`[${new Date().toISOString()}] --- Finished getUserAttempts ---`);
    }
};

/**
 * @desc    Delete all attempts for the logged-in user
 * @route   DELETE /api/users/attempts
 * @access  Private
 */
const clearUserAttempts = async (req, res) => {
    console.log(`[${new Date().toISOString()}] --- Executing clearUserAttempts ---`);
    try {
        const userId = req.user._id;

        // --- Time Deletion Query ---
        console.time(`[Attempts] Delete All Attempts (${userId})`);
        const result = await Attempt.deleteMany({ user: userId });
        console.timeEnd(`[Attempts] Delete All Attempts (${userId})`);
        // ------------------------------

        console.log(`[${new Date().toISOString()}] Deleted ${result.deletedCount} attempts for user.`);
        res.json({ message: 'Attempt history cleared successfully', deletedCount: result.deletedCount });

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error in clearUserAttempts:`, error);
        res.status(500).json({ message: 'Server Error clearing attempts' });
    } finally {
        console.log(`[${new Date().toISOString()}] --- Finished clearUserAttempts ---`);
    }
};


// --- Export all functions ---
module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserStats,
  getLeaderboard,
  getUserAttempts,
  clearUserAttempts, // <-- Added new function
};