// chessbit-backend/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { check, validationResult } = require('express-validator');

// Signup Route with Validation
router.post(
  '/signup',
  [
    check('walletAddress', 'Wallet address is required').isEthereumAddress(),
    check('username', 'Username must be at least 3 characters').isLength({ min: 3 }),
    // Email is optional
    check('email').optional().isEmail().withMessage('Invalid email address'),
    check('message', 'Message is required').not().isEmpty(),
    check('signature', 'Signature is required').not().isEmpty(),
  ],
  async (req, res) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    await authController.signup(req, res);
  }
);

// Login Route with Validation
router.post(
  '/login',
  [
    check('walletAddress', 'Wallet address is required').isEthereumAddress(),
    check('message', 'Message is required').not().isEmpty(),
    check('signature', 'Signature is required').not().isEmpty(),
  ],
  async (req, res) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    await authController.login(req, res);
  }
);

module.exports = router;
