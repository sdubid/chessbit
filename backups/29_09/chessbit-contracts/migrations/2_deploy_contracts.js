const ChessGame = artifacts.require("ChessGame");

module.exports = function (deployer) {
  deployer.deploy(ChessGame);
};
