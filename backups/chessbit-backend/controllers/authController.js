// chessbit-backend/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const ethers = require('ethers');

// Helper function to recover address from signed message
const recoverAddress = (message, signature) => {
  return ethers.utils.verifyMessage(message, signature);
};

// Signup Controller (MetaMask-based)
exports.signup = async (req, res) => {
  try {
    const { walletAddress, username, email, message, signature } = req.body;

    // Verify that walletAddress matches the recovered address from signature
    const recoveredAddress = recoverAddress(message, signature);

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(400).json({ message: 'Signature verification failed.' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ walletAddress });
    if (userExists) {
      return res.status(400).json({ message: 'Wallet address already registered.' });
    }

    // Check if username is taken
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: 'Username already taken.' });
    }

    // Create new user
    const newUser = new User({
      walletAddress,
      username,
      email,
    });

    await newUser.save();

    // Create JWT
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    res.status(201).json({
      token,
      user: {
        walletAddress: newUser.walletAddress,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Server error during signup.' });
  }
};

// Login Controller (MetaMask-based)
exports.login = async (req, res) => {
  try {
    const { walletAddress, message, signature } = req.body;

    // Recover address from signature
    const recoveredAddress = recoverAddress(message, signature);

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(400).json({ message: 'Signature verification failed.' });
    }

    // Check if user exists
    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.status(400).json({ message: 'Wallet address not registered.' });
    }

    // Create JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    res.json({
      token,
      user: {
        walletAddress: user.walletAddress,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};
