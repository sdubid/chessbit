import React from 'react';
import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';
import axios from 'axios';

// Change the arrow function to a regular function declaration
function WalletLogin() {
  const handleLogin = async () => {
    try {
      const provider = await detectEthereumProvider();
      if (provider) {
        await provider.request({ method: 'eth_requestAccounts' });
        const web3 = new Web3(provider);
        const accounts = await web3.eth.getAccounts();
        const publicAddress = accounts[0];

        const nonceRes = await axios.post('/api/auth/nonce', { publicAddress });
        const { nonce } = nonceRes.data;

        const signature = await web3.eth.personal.sign(
          `I am signing my one-time nonce: ${nonce}`,
          publicAddress,
          ''
        );

        const authRes = await axios.post('/api/auth/wallet-login', {
          publicAddress,
          signature,
        });

        const { token } = authRes.data;
        console.log('JWT Token:', token);
        localStorage.setItem('token', token);
      } else {
        alert('Please install MetaMask!');
      }
    } catch (err) {
      console.error('Error during wallet login:', err);
      alert('Login failed. Please try again.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogin}
    >
      Login with MetaMask
    </button>
  );
}

export default WalletLogin;
