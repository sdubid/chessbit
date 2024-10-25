// src/utils/ethers.js

import { BrowserProvider } from 'ethers';

let provider;
let signerPromise;
const gameContractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'; // Replace with your GameContract address
const tokenAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Replace with your ChessBitToken address

function initializeEthers() {
  if (window.ethereum) {
    provider = new BrowserProvider(window.ethereum);
    signerPromise = provider
      .send('eth_requestAccounts', [])
      .then(() => provider.getSigner())
      .catch((err) => {
        console.error('User denied account access', err);
        return null;
      });
  } else {
    alert('Please install MetaMask!');
  }
}

function getProvider() {
  return provider;
}

function getSignerPromise() {
  return signerPromise;
}

export {
  initializeEthers,
  getProvider,
  getSignerPromise,
  gameContractAddress,
  tokenAddress,
};
