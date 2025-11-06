// src/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const registerUser = async (req, res) => {
  const { firstName, lastName, email, password, birthday, school, district } = req.body;

  if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'First name, last name, email, and password are required.' });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email.' });
    }

    const user = new User({
      firstName,
      lastName,
      email,
      password,
      ...(birthday && { birthday: new Date(birthday) }),
      ...(school && { school }),
      ...(district && { district }),
    });

    const createdUser = await user.save();

    res.status(201).json({
      _id: createdUser._id,
      firstName: createdUser.firstName,
      lastName: createdUser.lastName,
      email: createdUser.email,
      role: createdUser.role,
      token: generateToken(createdUser._id),
    });

  } catch (error) {
    console.error("Registration Error:", error);
     if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: "Validation failed", errors: messages });
    }
    res.status(500).json({ message: 'Server Error during registration', error: error.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
     return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);

      // Make sure this 'user' object has 'firstName' and 'lastName'
      res.status(200).json({
        token,
        user: {
          id: user._id,
          firstName: user.firstName, // MUST send firstName
          lastName: user.lastName,   // MUST send lastName
          email: user.email,
          role: user.role,
          birthday: user.birthday,
          school: user.school,
          district: user.district,
          award: user.award,
        },
      });
      // ------------------------------------------------

    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Ensure both functions are correctly exported
module.exports = {
  registerUser,
  loginUser,
};