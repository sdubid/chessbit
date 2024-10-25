// src/components/CreateGame.js

import React, { useState } from 'react';
import { parseUnits, Contract } from 'ethers';
import {
  getSignerPromise,
  gameContractAddress,
  tokenAddress,
} from '../utils/ethers';
import tokenArtifact from '../contracts/ChessBitToken.json';
import gameContractArtifact from '../contracts/GameContract.json';

function CreateGame() {
  const [stake, setStake] = useState('');

  const createGame = async () => {
    try {
      const signer = await getSignerPromise();

      if (!signer) {
        alert('Signer not available');
        return;
      }

      const stakeAmount = parseUnits(stake.toString(), 18);

      // Create contract instances using the signer
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
      await createGameTx.wait();

      alert('Game created successfully');
    } catch (err) {
      console.error('Error creating game:', err);
      alert('Error creating game');
    }
  };

  return (
    <div>
      <h2>Create Game</h2>
      <input
        type="number"
        placeholder="Stake Amount"
        value={stake}
        onChange={(e) => setStake(e.target.value)}
      />
      <button type="button" onClick={createGame}>
        Create Game
      </button>
    </div>
  );
}

export default CreateGame;
