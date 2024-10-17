// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ChessGame {
    struct Game {
        uint256 gameId;
        address player1;
        address player2;
        uint256 stake;
        address winner;
        uint256 timestamp;
        bool player2Joined; // Tracks if player2 has joined
    }

    mapping(uint256 => Game) public games;
    uint256 public gameCount = 0;

    // Events to track game lifecycle
    event GameCreated(uint256 indexed gameId, address indexed player1, address indexed player2, uint256 stake);
    event GameJoined(uint256 indexed gameId, address indexed player2);
    event GameFinished(uint256 indexed gameId, address indexed winner);

    // Function to create a new game with a stake
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
            player2Joined: false
        });

        emit GameCreated(gameCount, msg.sender, _player2, msg.value);
    }

    // Function to join an existing game
    function joinGame(uint256 _gameId) public payable {
        Game storage game = games[_gameId];
        require(game.player2 == msg.sender, "You are not the invited player");
        require(game.winner == address(0), "Game already finished");
        require(msg.value == game.stake, "Stake amount must match");
        require(!game.player2Joined, "Player2 already joined");

        // Update game state
        game.player2Joined = true;

        emit GameJoined(_gameId, msg.sender);
    }

    // Function to declare the winner and distribute the reward
    function declareWinner(uint256 _gameId, address _winner) public {
        Game storage game = games[_gameId];
        require(game.winner == address(0), "Winner already declared");
        require(msg.sender == game.player1 || msg.sender == game.player2, "Only players can declare winner");
        require(_winner == game.player1 || _winner == game.player2, "Invalid winner address");

        game.winner = _winner;

        // Transfer the combined stake to the winner
        payable(_winner).transfer(game.stake * 2);

        emit GameFinished(_gameId, _winner);
    }
}
