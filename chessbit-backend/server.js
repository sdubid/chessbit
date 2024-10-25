// server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const cors = require('cors');
const dotenv = require('dotenv');
const { Chess } = require('chess.js');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Connect Database
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/matchmaking', require('./routes/matchmaking'));

// In-memory game storage
const games = {};
const openGames = require('./routes/matchmaking').openGames;

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.user.id;
      return next();
    } catch (err) {
      return next(new Error('Authentication error'));
    }
  }
  next(new Error('Authentication error'));
});

// Socket connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('joinGame', async ({ gameId, publicAddress }) => {
    socket.join(`game-${gameId}`);
    console.log(`Socket ${socket.id} joined room game-${gameId}`);

    // Initialize game if it doesn't exist
    if (!games[gameId]) {
      const gameData = openGames.find((g) => g.gameId === gameId);
      games[gameId] = {
        chess: new Chess(),
        players: gameData ? gameData.colors : {}, 
        sockets: {}, 
        addresses: {}, 
      };
    }

    const gameData = games[gameId];

    // Store socket ID and update user's public address
    gameData.sockets[socket.userId] = socket.id;
    const user = await User.findById(socket.userId);
    if (user) {
      if (!user.publicAddress || user.publicAddress !== publicAddress) {
        user.publicAddress = publicAddress;
        await user.save();
      }
      console.log(`User ${socket.userId} publicAddress: ${user.publicAddress}`);
      gameData.addresses[socket.userId] = user.publicAddress;
    } else {
      console.error(`User not found: ${socket.userId}`);
    }

    // Emit game state, player color, and opponent address
    socket.emit('gameState', { fen: gameData.chess.fen() });
    const playerColor = gameData.players[socket.userId];
    socket.emit('playerColor', playerColor);

    const opponentUserId = Object.keys(gameData.players).find((uid) => uid !== socket.userId);
    if (opponentUserId && gameData.addresses[opponentUserId]) {
      const opponentAddress = gameData.addresses[opponentUserId];
      socket.emit('opponentAddress', opponentAddress);
      console.log(`Emitted opponentAddress to ${socket.id}: ${opponentAddress}`);

      const opponentSocketId = gameData.sockets[opponentUserId];
      const opponentSocket = io.sockets.sockets.get(opponentSocketId);
      if (opponentSocket) {
        opponentSocket.emit('opponentAddress', gameData.addresses[socket.userId]);
        console.log(`Emitted opponentAddress to ${opponentSocketId}: ${gameData.addresses[socket.userId]}`);
      }
    } else {
      console.log(`Opponent not connected or publicAddress not set for user ${opponentUserId}`);
    }
  });

  socket.on('move', ({ gameId, move }) => {
    const gameData = games[gameId];
    if (!gameData) {
      console.error(`Game with ID ${gameId} not found`);
      return;
    }

    const game = gameData.chess;
    const playerColor = gameData.players[socket.userId];

    if (
      (game.turn() === 'w' && playerColor !== 'white') ||
      (game.turn() === 'b' && playerColor !== 'black')
    ) {
      socket.emit('invalidMove', { message: 'Not your turn' });
      return;
    }

    try {
      const validMove = game.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || 'q',
      });

      if (validMove) {
        io.to(`game-${gameId}`).emit('gameState', { fen: game.fen() });
      } else {
        socket.emit('invalidMove', { message: 'Invalid move' });
      }
    } catch (error) {
      console.error('Error processing move:', error);
      socket.emit('invalidMove', { message: 'Invalid move' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
