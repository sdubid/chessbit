// routes/matchmaking.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

let openGames = []; // In-memory list of open games

// @route   GET api/matchmaking/open-games
// @desc    Get list of open games
// @access  Private
router.get('/open-games', auth, (req, res) => {
  res.json(openGames);
});

// @route   GET api/matchmaking/game/:gameId
// @desc    Get game details
// @access  Private
router.get('/game/:gameId', auth, (req, res) => {
  const { gameId } = req.params;
  const game = openGames.find((g) => g.gameId === gameId);
  if (game) {
    res.json({ stake: game.stake });
  } else {
    res.status(404).json({ msg: 'Game not found' });
  }
});

// @route   POST api/matchmaking/create-game
// @desc    Create a new game
// @access  Private
router.post('/create-game', auth, (req, res) => {
  const userId = req.user.id;
  const { stake, gameId } = req.body; // Get gameId from request body
  openGames.push({
    gameId,
    player1: userId,
    stake,
    colors: {
      [userId]: 'white',
    },
  });
  res.json({ gameId });
});

// @route   POST api/matchmaking/join-game
// @desc    Join an existing game
// @access  Private
router.post('/join-game', auth, (req, res) => {
  const { gameId } = req.body;
  const userId = req.user.id;
  const game = openGames.find((g) => g.gameId === gameId);
  if (game) {
    if (game.player2) {
      return res.status(400).json({ msg: 'Game already has two players' });
    }
    game.player2 = userId;
    game.colors[userId] = 'black';
    res.json({ msg: 'Joined game', gameId });
  } else {
    res.status(404).json({ msg: 'Game not found' });
  }
});

// Export openGames for use in server.js
module.exports = router;
module.exports.openGames = openGames;
