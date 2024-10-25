// blockchain/ethers.js

const { ethers } = require('ethers');

// Connect to the local Hardhat node
const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');

// Use the first account provided by Hardhat
const signer = provider.getSigner(0);

module.exports = { provider, signer };