// migrations/2_deploy_contracts.js

const ChessGame = artifacts.require("ChessGame");

module.exports = function (deployer) {
  deployer.deploy(ChessGame);
};