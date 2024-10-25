// src/components/ChessGame.js

import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useParams } from 'react-router-dom';
import { Contract } from 'ethers';
import socket from '../utils/socket';
import { getSignerPromise, gameContractAddress } from '../utils/ethers';
import gameContractArtifact from '../contracts/GameContract.json';

function ChessGame() {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const gameRef = useRef(null);
  const [playerColor, setPlayerColor] = useState('white');
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [signerAddress, setSignerAddress] = useState(null);
  const [opponentAddress, setOpponentAddress] = useState(null);

  const opponentAddressRef = useRef(null);
  const signerAddressRef = useRef(null);

  const updateGameState = (newGame) => {
    setGame(newGame);
    gameRef.current = newGame;
  };

  const endGame = async (winnerAddress) => {
    if (!winnerAddress) {
      console.error('Winner address is null. Cannot end game.');
      return;
    }

    const signer = await getSignerPromise();

    if (!signer) {
      alert('Signer not available');
      return;
    }

    const gameContract = new Contract(
      gameContractAddress,
      gameContractArtifact.abi,
      signer
    );

    try {
      const endGameTx = await gameContract.endGame(gameId, winnerAddress);
      await endGameTx.wait();

      alert('Game ended and rewards distributed');
    } catch (error) {
      console.error('Error ending game:', error);
      alert('Failed to end game. Please try again.');
    }
  };

  const checkGameOver = () => {
    if (gameRef.current && gameRef.current.isGameOver()) {
      setIsGameOver(true);

      if (gameRef.current.isCheckmate()) {
        const winnerAddress =
          gameRef.current.turn() === 'w'
            ? opponentAddressRef.current
            : signerAddressRef.current;

        if (!winnerAddress) {
          console.warn(
            'Winner address is null, waiting for opponentAddress to be set.'
          );
          setTimeout(checkGameOver, 500);
          return;
        }

        setWinner(winnerAddress);
        endGame(winnerAddress);
      } else {
        alert('The game ended in a draw');
      }
    }
  };

  useEffect(() => {
    const setupGame = async () => {
      const token = localStorage.getItem('token');
      socket.auth = { token };

      if (!socket.connected) {
        socket.connect();
      }

      const signer = await getSignerPromise();
      let address = null;
      if (signer) {
        address = await signer.getAddress();
        setSignerAddress(address);
        signerAddressRef.current = address;
      }

      socket.on('gameState', ({ fen }) => {
        const newGame = new Chess(fen);
        updateGameState(newGame);
        checkGameOver();
      });

      socket.on('playerColor', (color) => {
        setPlayerColor(color);
      });

      // Renamed 'address' to 'opponentAddr' to avoid shadowing
      socket.on('opponentAddress', (opponentAddr) => {
        console.log('Received opponentAddress:', opponentAddr);
        setOpponentAddress(opponentAddr);
        opponentAddressRef.current = opponentAddr;
        if (gameRef.current && gameRef.current.isGameOver()) {
          checkGameOver();
        }
      });

      socket.on('invalidMove', (data) => {
        // Do nothing; invalid moves are prevented locally
      });

      if (address) {
        socket.emit('joinGame', { gameId, publicAddress: address });
      } else {
        console.error('Signer address is null. Cannot join game.');
      }
    };

    setupGame();

    return () => {
      socket.off('gameState');
      socket.off('playerColor');
      socket.off('opponentAddress');
      socket.off('invalidMove');
    };
  }, [gameId]);

  const onDrop = (sourceSquare, targetSquare) => {
    if (!gameRef.current || isGameOver) return false;

    if (
      (gameRef.current.turn() === 'w' && playerColor !== 'white') ||
      (gameRef.current.turn() === 'b' && playerColor !== 'black')
    ) {
      return false;
    }

    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    };

    const tempGame = new Chess(gameRef.current.fen());
    const result = tempGame.move(move);

    if (result === null) {
      return false;
    }

    socket.emit('move', { gameId, move });

    return false;
  };

  return (
    <div>
      <h2>{isGameOver ? 'Game Over' : 'Game in Progress'}</h2>
      {game && (
        <Chessboard
          position={game.fen()}
          onPieceDrop={onDrop}
          boardOrientation={playerColor}
          arePiecesDraggable={!isGameOver}
          isDraggablePiece={({ piece }) => {
            if (isGameOver) return false;

            if (
              (playerColor === 'white' && piece.startsWith('w')) ||
              (playerColor === 'black' && piece.startsWith('b'))
            ) {
              if (
                (gameRef.current.turn() === 'w' && playerColor === 'white') ||
                (gameRef.current.turn() === 'b' && playerColor === 'black')
              ) {
                return true;
              }
            }
            return false;
          }}
        />
      )}
      {isGameOver && winner && (
        <p>{winner === signerAddress ? 'You won!' : 'You lost!'}</p>
      )}
    </div>
  );
}

export default ChessGame;
