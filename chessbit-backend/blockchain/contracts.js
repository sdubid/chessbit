// blockchain/contracts.js

const { ethers } = require('ethers');
const { provider, signer } = require('./ethers');
const tokenArtifact = require('../artifacts/contracts/ChessBitToken.sol/ChessBitToken.json');
const gameContractArtifact = require('../artifacts/contracts/GameContract.sol/GameContract.json');

const tokenAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const gameContractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

const tokenContract = new ethers.Contract(tokenAddress, tokenArtifact.abi, signer);
const gameContract = new ethers.Contract(gameContractAddress, gameContractArtifact.abi, signer);

module.exports = {
  tokenContract,
  gameContract,
};