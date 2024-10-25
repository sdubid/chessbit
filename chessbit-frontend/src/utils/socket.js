// src/utils/socket.js

import { io } from 'socket.io-client';

const socket = io('http://localhost:5001', {
  autoConnect: false, // Prevent automatic connection
});

export default socket;
