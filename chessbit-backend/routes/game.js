// routes/game.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { tokenContract, gameContract } = require('../blockchain/contracts');
const { ethers } = require('ethers');

// @route   POST api/game/create
// @desc    Create a new game
// @access  Private
router.post('/create', auth, async (req, res) => {
  const { stake } = req.body;
  const userId = req.user.id;

  try {
    // Fetch user's public address from the database
    const user = await User.findById(userId);
    const player1Address = user.publicAddress;

    // Create a new signer instance for the user
    const player1Signer = tokenContract.provider.getSigner(player1Address);

    // Convert stake to BigNumber
    const stakeAmount = ethers.utils.parseUnits(stake.toString(), 18);

    // Approve token transfer to the game contract
    const approveTx = await tokenContract.connect(player1Signer).approve(gameContract.address, stakeAmount);
    await approveTx.wait();

    // Create game with only stake (no player2 required)
    const createGameTx = await gameContract.connect(player1Signer).createGame(stakeAmount);
    await createGameTx.wait();

    res.json({ msg: 'Game created successfully' });
  } catch (err) {
    console.error('Error creating game:', err);
    res.status(500).send('Server error');
  }
});

// @route   POST api/game/join
// @desc    Join a game
// @access  Private
router.post('/join', auth, async (req, res) => {
  const { gameId } = req.body; // Get gameId from request body
  const userId = req.user.id;

  try {
    // Fetch user's public address from the database
    const user = await User.findById(userId);
    const player2Address = user.publicAddress;

    // Create a new signer instance for the joining player (player2)
    const player2Signer = tokenContract.provider.getSigner(player2Address);

    // Get game details from the contract using the gameId
    const game = await gameContract.games(gameId);
    const stakeAmount = game.stake;

    // Approve token transfer for joining the game
    const approveTx = await tokenContract.connect(player2Signer).approve(gameContract.address, stakeAmount);
    await approveTx.wait();

    // Join the game on the blockchain
    const joinGameTx = await gameContract.connect(player2Signer).joinGame(gameId);
    await joinGameTx.wait();

    res.json({ msg: 'Joined game successfully' });
  } catch (err) {
    console.error('Error joining game:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
