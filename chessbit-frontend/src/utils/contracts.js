// src/utils/contracts.js

import { Contract } from 'ethers';
import { signer } from './ethers';
import tokenArtifact from '../contracts/ChessBitToken.json';
import gameContractArtifact from '../contracts/GameContract.json';

const tokenAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const gameContractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

const tokenContract = new Contract(tokenAddress, tokenArtifact.abi, signer);
const gameContract = new Contract(gameContractAddress, gameContractArtifact.abi, signer);

export { tokenContract, gameContract };