// routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const { recoverPersonalSignature } = require('eth-sig-util');
const { bufferToHex } = require('ethereumjs-util');
const auth = require('../middleware/auth'); // Import the auth middleware

// @route   POST api/auth/register
// @desc    Register user (email/password or publicAddress)
// @access  Public
router.post(
  '/register',
  async (req, res) => {
    const { username, email, password, publicAddress } = req.body;

    // Ensure at least one method of registration is provided
    if (!publicAddress && (!username || !email || !password)) {
      return res.status(400).json({ errors: [{ msg: 'Please provide publicAddress or username, email, and password' }] });
    }

    try {
      let user;

      if (publicAddress) {
        // Registration via publicAddress
        user = await User.findOne({ publicAddress });
        if (user) {
          return res.status(400).json({ errors: [{ msg: 'Public address already exists' }] });
        }

        // Create new user with publicAddress
        user = new User({
          publicAddress,
          username: publicAddress, // You can assign a default username or leave it null
        });

        await user.save();
      } else {
        // Registration via email/password
        const errors = [];
        if (!username) {
          errors.push({ msg: 'Username is required' });
        }
        if (!email) {
          errors.push({ msg: 'Email is required' });
        } else if (!/\S+@\S+\.\S+/.test(email)) {
          errors.push({ msg: 'Please include a valid email' });
        }
        if (!password || password.length < 6) {
          errors.push({ msg: 'Password must be at least 6 characters' });
        }

        if (errors.length > 0) {
          return res.status(400).json({ errors });
        }

        // Check if the username or email already exists
        user = await User.findOne({ $or: [{ username }, { email }] });
        if (user) {
          return res.status(400).json({ errors: [{ msg: 'Username or Email already exists' }] });
        }

        // Create new user with email/password
        user = new User({
          username,
          email,
          password,
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();
      }

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '1h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error('Error while registering:', err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token (email/password or publicAddress)
// @access  Public
router.post(
  '/login',
  async (req, res) => {
    const { email, password, publicAddress } = req.body;

    // Ensure at least one method of login is provided
    if (!publicAddress && (!email || !password)) {
      return res.status(400).json({ errors: [{ msg: 'Please provide publicAddress or email and password' }] });
    }

    try {
      let user;

      if (publicAddress) {
        // Login via publicAddress
        user = await User.findOne({ publicAddress });
        if (!user) {
          return res.status(400).json({ errors: [{ msg: 'User not found' }] });
        }

        // Generate JWT token
        const payload = {
          user: {
            id: user.id,
          },
        };

        jwt.sign(
          payload,
          process.env.JWT_SECRET,
          { expiresIn: '1h' },
          (err, token) => {
            if (err) throw err;
            res.json({ token });
          }
        );
      } else {
        // Login via email/password
        if (!email || !password) {
          return res.status(400).json({ errors: [{ msg: 'Email and password are required' }] });
        }

        user = await User.findOne({ email });

        if (!user) {
          return res.status(401).json({ errors: [{ msg: 'Invalid credentials' }] });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return res.status(401).json({ errors: [{ msg: 'Invalid credentials' }] });
        }

        const payload = {
          user: {
            id: user.id,
          },
        };

        jwt.sign(
          payload,
          process.env.JWT_SECRET,
          { expiresIn: '1h' },
          (err, token) => {
            if (err) throw err;
            res.json({ token });
          }
        );
      }
    } catch (err) {
      console.error('Error while logging in:', err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/auth/nonce
// @desc    Get nonce for a given public address
// @access  Public
router.post('/nonce', async (req, res) => {
  const { publicAddress } = req.body;

  if (!publicAddress) {
    return res.status(400).json({ msg: 'Public address is required' });
  }

  try {
    let user = await User.findOne({ publicAddress });

    if (!user) {
      // Create new user if not exists
      user = new User({
        username: publicAddress, // Assign publicAddress as username or set to null
        publicAddress,
      });
      await user.save();
    }

    res.json({ nonce: user.nonce });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/wallet-login
// @desc    Authenticate user via wallet signature
// @access  Public
router.post('/wallet-login', async (req, res) => {
  const { publicAddress, signature } = req.body;

  if (!publicAddress || !signature) {
    return res.status(400).json({ msg: 'Public address and signature are required' });
  }

  try {
    let user = await User.findOne({ publicAddress });

    if (!user) {
      // Create new user if not exists
      user = new User({
        username: publicAddress,
        publicAddress,
      });
      await user.save();
    }

    const msg = `I am signing my one-time nonce: ${user.nonce}`;
    const msgBufferHex = bufferToHex(Buffer.from(msg, 'utf8'));

    const address = recoverPersonalSignature({
      data: msgBufferHex,
      sig: signature,
    });

    if (address.toLowerCase() === publicAddress.toLowerCase()) {
      // Signature verified
      user.nonce = Math.floor(Math.random() * 1000000);
      await user.save();

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '1h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } else {
      res.status(401).json({ msg: 'Signature verification failed' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/user
// @desc    Get user data (Protected route)
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    // Fetch user data, excluding password and nonce
    const user = await User.findById(req.user.id).select('-password -nonce');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;