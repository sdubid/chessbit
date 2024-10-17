// truffle-config.js

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",     // Localhost
      port: 7545,            // Ganache GUI default port
      network_id: "*",       // Any network ID
      gas: 6721975,          // Gas limit for deployment
      gasPrice: 20000000000, // Adjust this if necessary
    },
  },
  compilers: {
    solc: {
      version: "0.8.20",      // Specify the Solidity compiler version
      settings: {
        optimizer: {
          enabled: true,     // Enable optimization
          runs: 200,         // Optimize for how many times you intend to run the code
        },
      },
    },
  },
};