// chessbit-contracts/contracts/ChessGame.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ChessGame is Ownable, ReentrancyGuard {
    struct Game {
        uint256 gameId;
        address player1;
        address player2;
        uint256 stake;
        address winner;
        uint256 timestamp;
        bool player2Joined;
        bool isFinished;
    }

    mapping(uint256 => Game) public games;
    uint256 public gameCount = 0;

    // Oracle address for winner declaration
    address public oracle;

    constructor() Ownable(msg.sender) {
  
  }

    // Events
    event GameCreated(uint256 indexed gameId, address indexed player1, address indexed player2, uint256 stake);
    event GameJoined(uint256 indexed gameId, address indexed player2);
    event GameFinished(uint256 indexed gameId, address indexed winner);

    // Modifier to check if caller is the authorized oracle
    modifier onlyOracle() {
        require(msg.sender == oracle, "Caller is not the authorized oracle");
        _;
    }

    // Function to set the oracle address (only owner can set)
    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Invalid oracle address");
        oracle = _oracle;
    }

    // Create a new game
    function createGame(address _player2) public payable {
        require(msg.value > 0, "Stake must be greater than zero");
        require(_player2 != address(0), "Invalid player2 address");
        require(_player2 != msg.sender, "Player2 cannot be the same as player1");

        gameCount++;
        games[gameCount] = Game({
            gameId: gameCount,
            player1: msg.sender,
            player2: _player2,
            stake: msg.value,
            winner: address(0),
            timestamp: block.timestamp,
            player2Joined: false,
            isFinished: false
        });

        emit GameCreated(gameCount, msg.sender, _player2, msg.value);
    }

    // Join an existing game
    function joinGame(uint256 _gameId) public payable nonReentrant {
        Game storage game = games[_gameId];
        require(game.player2 == msg.sender, "You are not the invited player");
        require(game.winner == address(0), "Game already finished");
        require(msg.value == game.stake, "Stake amount must match");
        require(!game.player2Joined, "Player2 already joined");

        game.player2Joined = true;

        emit GameJoined(_gameId, msg.sender);
    }

    // Function for the oracle to declare the winner
    function declareWinner(uint256 _gameId, address _winner) external onlyOracle nonReentrant {
        Game storage game = games[_gameId];
        require(!game.isFinished, "Game already finished");
        require(_winner == game.player1 || _winner == game.player2, "Invalid winner address");

        game.winner = _winner;
        game.isFinished = true;

        // Transfer the combined stake to the winner
        payable(_winner).transfer(game.stake * 2);

        emit GameFinished(_gameId, _winner);
    }
}