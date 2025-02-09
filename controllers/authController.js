const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Cookie configuration
const cookieOptions = {
  httpOnly: true,
  secure: 'production', // HTTPS only in production
  sameSite: 'Lax',
  maxAge: 24 * 60 * 60 * 1000 // 1 hour in milliseconds
};

// @desc    Register user
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ username, email, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('token', token, cookieOptions)
       .json({
         _id: user._id,
         username: user.username,
         email: user.email,
         role: user.role
       });
  } catch (err) {
    res.status(500).json({ message: 'Server Error',err });
  }
};

// @desc    Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('token', token, cookieOptions)
       .json({
         _id: user._id,
         username: user.username,
         email: user.email,
         role: user.role
       });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const checkAuth = async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json(null);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      res.clearCookie('token');
      return res.status(401).json(null);
    }

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    });
  } catch (err) {
    res.clearCookie('token');
    res.status(401).json(null);
  }
};

// @desc    Logout user
const logoutUser = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict'
  }).json({ message: 'Logged out successfully' });
};

// @desc    Guest login
const guestLogin = async (req, res) => {
  try {
    const guestUser = new User({
      username: `guest-${Date.now()}`,
      email: `guest-${Date.now()}@example.com`,
      password: 'temporary-password',
      role: 'guest'
    });

    await guestUser.save();

    const token = jwt.sign(
      { id: guestUser._id, role: guestUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('token', token, cookieOptions)
       .json({
         _id: guestUser._id,
         username: guestUser.username,
         email: guestUser.email,
         role: guestUser.role
       });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { registerUser, loginUser, logoutUser, guestLogin,checkAuth};