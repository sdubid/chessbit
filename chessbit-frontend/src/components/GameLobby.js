// src/components/GameLobby.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Contract, parseUnits } from 'ethers';
import {
  getSignerPromise,
  gameContractAddress,
  tokenAddress,
} from '../utils/ethers';
import tokenArtifact from '../contracts/ChessBitToken.json';
import gameContractArtifact from '../contracts/GameContract.json';

function GameLobby() {
  const [openGames, setOpenGames] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      axios
        .get('/api/matchmaking/open-games', {
          headers: {
            'x-auth-token': token,
          },
        })
        .then((response) => {
          setOpenGames(response.data);
        })
        .catch((err) => {
          console.error('Error fetching open games:', err);
          alert('Failed to fetch open games. Please login again.');
          navigate('/login');
        });
    } else {
      alert('No token found, please login first.');
      navigate('/login');
    }
  }, [navigate]);

  const createGame = async () => {
    const stake = prompt('Enter stake amount in tokens:');

    if (stake && !Number.isNaN(parseFloat(stake)) && parseFloat(stake) > 0) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const signer = await getSignerPromise();

          if (!signer) {
            alert('Signer not available');
            return;
          }

          const stakeAmount = parseUnits(stake.toString(), 18);

          const tokenContract = new Contract(
            tokenAddress,
            tokenArtifact.abi,
            signer
          );

          const gameContract = new Contract(
            gameContractAddress,
            gameContractArtifact.abi,
            signer
          );

          // Approve token transfer
          const approveTx = await tokenContract.approve(
            gameContractAddress,
            stakeAmount
          );
          await approveTx.wait();

          // Create game on blockchain
          const createGameTx = await gameContract.createGame(stakeAmount);
          const receipt = await createGameTx.wait();

          // Parse the logs to get the GameCreated event
          let gameId;

          for (const log of receipt.logs) {
            try {
              const parsedLog = gameContract.interface.parseLog(log);
              if (parsedLog.name === 'GameCreated') {
                gameId = parsedLog.args.gameId.toString();
                break;
              }
            } catch (e) {
              // Ignore logs that don't belong to the contract
            }
          }

          if (!gameId) {
            console.error('GameCreated event not found in transaction receipt');
            alert('Failed to create game. Please try again.');
            return;
          }

          // Create game in backend
          await axios.post(
            '/api/matchmaking/create-game',
            { stake, gameId },
            {
              headers: {
                'x-auth-token': token,
              },
            }
          );

          navigate(`/game/${gameId}`);
        } catch (err) {
          console.error('Error creating game:', err);
          alert('Failed to create game. Please try again.');
        }
      } else {
        alert('No token found, please login first.');
        navigate('/login');
      }
    } else {
      alert('Please enter a valid stake amount.');
    }
  };

  const joinGame = async (gameId) => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        // Fetch stake amount from backend
        const response = await axios.get(`/api/matchmaking/game/${gameId}`, {
          headers: {
            'x-auth-token': token,
          },
        });

        const { stake } = response.data;

        const signer = await getSignerPromise();

        if (!signer) {
          alert('Signer not available');
          return;
        }

        const stakeAmount = parseUnits(stake.toString(), 18);

        const tokenContract = new Contract(
          tokenAddress,
          tokenArtifact.abi,
          signer
        );

        const gameContract = new Contract(
          gameContractAddress,
          gameContractArtifact.abi,
          signer
        );

        // Approve token transfer
        const approveTx = await tokenContract.approve(
          gameContractAddress,
          stakeAmount
        );
        await approveTx.wait();

        // Join game on blockchain
        const joinGameTx = await gameContract.joinGame(gameId);
        await joinGameTx.wait();

        // Join game in backend
        await axios.post(
          '/api/matchmaking/join-game',
          { gameId },
          {
            headers: {
              'x-auth-token': token,
            },
          }
        );

        navigate(`/game/${gameId}`);
      } catch (err) {
        console.error('Error joining game:', err);
        alert('Failed to join game. Please try again.');
      }
    } else {
      alert('No token found, please login first.');
      navigate('/login');
    }
  };

  return (
    <div>
      <h2>Game Lobby</h2>
      <button type="button" onClick={createGame}>
        Create New Game
      </button>
      <h3>Open Games</h3>
      <ul>
        {openGames.map((game) => (
          <li key={game.gameId}>
            Game ID: {game.gameId}, Stake: {game.stake} tokens
            <button type="button" onClick={() => joinGame(game.gameId)}>
              Join Game
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GameLobby;
