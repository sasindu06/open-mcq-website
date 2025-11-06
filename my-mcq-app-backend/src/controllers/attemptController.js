// src/controllers/attemptController.js

const Attempt = require('../models/Attempt.js');
const Question = require('../models/Question.js');
const User = require('../models/User.js'); // Added User model for score update
const mongoose = require('mongoose');

// --- NEW: Helper function to fix old data (SAME AS ADMIN CONTROLLER) ---
/**
 * Transforms old [String] options into new [{text, imageUrl}] format.
 * If options are already in the new format, it just ensures nulls are set.
 */
const transformOptions = (options) => {
    if (!options || options.length === 0) {
        return [];
    }
    // Check if already in new format
    if (typeof options[0] === 'object' && options[0] !== null && (options[0].text !== undefined || options[0].imageUrl !== undefined)) {
        return options.map(opt => ({
            text: opt.text || null,
            imageUrl: opt.imageUrl || null
        }));
    }
    // Check if old [String] format
    if (typeof options[0] === 'string') {
        return options.map(optString => ({
            text: optString,
            imageUrl: null
        }));
    }
    return [];
};
// ------------------------------------------

/**
 * @desc    Start a new quiz attempt
 * @route   POST /api/attempts/start
 * @access  Private
 */
const startAttempt = async (req, res) => {
  const { grade, subject, year } = req.body;
  const userId = req.user.id;

  if (!grade || !subject || !year) {
    return res.status(400).json({ message: 'Please provide grade, subject, and year' });
  }

  try {
    // 1. Find questions for this paper
    // (We don't need the options/text yet, just the count)
    const questions = await Question.find({ grade, subject, year: Number(year) })
                                    .limit(40) // Standard paper size
                                    .select('_id'); // Only need IDs to check count

    if (questions.length === 0) {
      return res.status(404).json({ message: 'No questions found for this paper.' });
    }

    const totalQuestions = questions.length;

    // 2. Create the new attempt document
    const attempt = new Attempt({
      user: userId,
      grade,
      subject,
      year: Number(year),
      answers: [], // Empty answers array to start
      score: 0,
      totalQuestions: totalQuestions,
    });

    const createdAttempt = await attempt.save();

    console.log(`[${new Date().toISOString()}] New attempt ${createdAttempt._id} started for user ${userId}.`);
    
    // 3. Respond with the ID of the new attempt
    res.status(201).json({
      message: 'Attempt started successfully',
      attemptId: createdAttempt._id,
      totalQuestions: totalQuestions,
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error starting attempt:`, error);
    res.status(500).json({ message: 'Server error starting attempt' });
  }
};

/**
 * @desc    Get details for a specific attempt (e.g., for quiz page)
 * @route   GET /api/attempts/:id
 * @access  Private
 */
const getAttemptDetails = async (req, res) => {
  try {
    const attemptId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
         return res.status(400).json({ message: 'Invalid attempt ID' });
    }
    
    // 1. Find the attempt
    const attempt = await Attempt.findById(attemptId).select('grade subject year totalQuestions user answers');
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    // 2. Check if this attempt belongs to the logged-in user
    if (attempt.user.toString() !== req.user.id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this attempt' });
    }

    // 3. Fetch the questions associated with this paper
    const questions = await Question.find({
      grade: attempt.grade,
      subject: attempt.subject,
      year: attempt.year
    })
    .limit(attempt.totalQuestions) // Ensure we only fetch the expected number
    .select('question options contextImageUrl contextText') // Select fields needed for quiz
    .lean(); // Use .lean() for faster processing
    
    if (questions.length === 0) {
        return res.status(404).json({ message: 'Questions for this attempt could not be found.'});
    }

    // 4. Create a map of saved answers (if any)
    const userAnswersMap = new Map(
        attempt.answers.map(ans => [ans.questionId.toString(), ans.userAnswer])
    );

    // 5. Build the response object
    const response = {
      _id: attempt._id,
      grade: attempt.grade,
      subject: attempt.subject,
      year: attempt.year,
      totalQuestions: attempt.totalQuestions,
      questions: questions.map(q => ({
        questionId: q._id.toString(),
        questionText: q.question,
        // --- FIX: Transform options before sending ---
        options: transformOptions(q.options),
        // -------------------------------------------
        userAnswer: userAnswersMap.get(q._id.toString()) || null,
        contextImageUrl: q.contextImageUrl || null,
        contextText: q.contextText || null
      }))
    };

    res.json(response);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error getting attempt details:`, error);
    res.status(500).json({ message: 'Server error fetching attempt' });
  }
};


/**
 * @desc    Submit answers for an attempt
 * @route   POST /api/attempts/submit
 * @access  Private
 */
const submitAttempt = async (req, res) => {
    const { attemptId, answers, grade, subject, year } = req.body;
    const userId = req.user.id;

    if (!attemptId || !answers || !Array.isArray(answers)) {
        return res.status(400).json({ message: 'Attempt ID and answers array are required.' });
    }

    try {
        // 1. Find the attempt
        const attempt = await Attempt.findById(attemptId);
        if (!attempt) {
            return res.status(404).json({ message: 'Attempt not found.' });
        }
        // 2. Check ownership
        if (attempt.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to submit this attempt.' });
        }
         // 3. Check if already submitted (score > 0 or answers populated)
         // Note: We'll allow resubmission for now, just update the fields.
         // If we want to prevent resubmission, we'd check here.

        // 4. Get correct answers from Question collection
        const questionIds = answers.map(a => a.questionId);
        if (questionIds.some(id => !mongoose.Types.ObjectId.isValid(id))) {
             return res.status(400).json({ message: 'Invalid question ID in submission.' });
        }
        
        const correctQuestions = await Question.find({
            _id: { $in: questionIds }
        }).select('correctAnswer'); // Only need correct answers

        // Create a Map for easy lookup: { questionId: "correctAnswerText" }
        const correctAnswersMap = new Map(
            correctQuestions.map(q => [q._id.toString(), q.correctAnswer])
        );

        // 5. Calculate score and prepare review data
        let score = 0;
        const reviewData = [];
        const answersToSave = [];

        // We need the question text for the review data
        const allQuestionsData = await Question.find({
            _id: { $in: questionIds }
        }).select('question');
         const questionTextMap = new Map(
            allQuestionsData.map(q => [q._id.toString(), q.question])
        );

        for (const ans of answers) {
            const correctAnswer = correctAnswersMap.get(ans.questionId);
            const isCorrect = (ans.userAnswer === correctAnswer);
            
            if (isCorrect) {
                score++;
            }
            
            reviewData.push({
                questionId: ans.questionId,
                questionText: questionTextMap.get(ans.questionId) || 'Question text not found.',
                yourAnswer: ans.userAnswer,
                correctAnswer: correctAnswer || 'N/A',
                isCorrect: isCorrect
            });

            answersToSave.push({
                questionId: ans.questionId,
                userAnswer: ans.userAnswer || "" // Ensure empty string, not null
            });
        }

        // 6. Update the Attempt document
        attempt.score = score;
        attempt.answers = answersToSave; // Overwrite previous answers
        attempt.totalQuestions = answers.length; // Ensure totalQuestions matches submitted count
        // We set grade/subject/year from the body to ensure they are set
        attempt.grade = grade;
        attempt.subject = subject;
        attempt.year = year;
        
        await attempt.save();
        
        // --- 7. (Optional but good) Update user's 'award' based on score ---
        try {
            const percentage = (score / answers.length) * 100;
            if (percentage >= 80) { // e.g., 'Top Scorer'
                 await User.findByIdAndUpdate(userId, { $set: { award: 'Top Scorer' } });
            }
        } catch (awardError) {
             console.error(`[${new Date().toISOString()}] Failed to update award for user ${userId}:`, awardError);
        }
        // -----------------------------------------------------------------

        console.log(`[${new Date().toISOString()}] Attempt ${attemptId} submitted by user ${userId}. Score: ${score}/${answers.length}`);

        // 7. Send back the results
        res.json({
            message: 'Attempt submitted successfully',
            score: score,
            totalQuestions: answers.length,
            reviewData: reviewData
        });

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error submitting attempt:`, error);
        res.status(500).json({ message: 'Server error submitting attempt' });
    }
};

module.exports = {
  startAttempt,
  getAttemptDetails,
  submitAttempt,
};