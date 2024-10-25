// src/App.js

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import WalletLogin from './components/WalletLogin';
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './components/Dashboard';
import CreateGame from './components/CreateGame';
import ChessGame from './components/ChessGame';
import GameLobby from './components/GameLobby';
import { initializeEthers } from './utils/ethers';

function App() {
  useEffect(() => {
    initializeEthers();
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/wallet-login" element={<WalletLogin />} />

        {/* Private Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-game" element={<CreateGame />} />
          {/* Protected ChessGame route with dynamic gameId */}
          <Route path="/game/:gameId" element={<ChessGame />} />
          {/* Protected GameLobby route */}
          <Route path="/lobby" element={<GameLobby />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
