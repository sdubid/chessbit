// models/User.js

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: function () {
      return !this.publicAddress;
    },
    unique: true,
    sparse: true, // Allows null values
  },
  email: {
    type: String,
    required: function () {
      return !this.publicAddress;
    },
    unique: true,
    sparse: true, // Allows null values
  },
  password: {
    type: String,
    required: function () {
      return !this.publicAddress;
    },
  },
  balance: {
    type: Number,
    default: 0,
  },
  publicAddress: {
    type: String,
    required: function () {
      return !this.email; // Require publicAddress if email is not provided
    },
    unique: true,
    sparse: true, // Allows null values
  },
  nonce: {
    type: Number,
    default: Math.floor(Math.random() * 1000000),
  },
});

module.exports = mongoose.model('User', UserSchema);