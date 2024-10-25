// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract GameContract {
    IERC20 public token;
    uint256 public gameCount;

    constructor(address tokenAddress) {
        token = IERC20(tokenAddress);
    }

    struct Game {
        address player1;
        address player2;
        uint256 stake;
        bool isActive;
        address winner;
    }

    mapping(uint256 => Game) public games;

    // Events
    event GameCreated(uint256 gameId, address indexed player1, uint256 stake);
    event GameJoined(uint256 gameId, address indexed player2);
    event GameEnded(uint256 gameId, address indexed winner);

    // Create a game without specifying player2 initially
    function createGame(uint256 _stake) public {
        require(token.transferFrom(msg.sender, address(this), _stake), "Stake transfer failed");

        gameCount++;
        // Initialize player2 as address(0) indicating an open game
        games[gameCount] = Game(msg.sender, address(0), _stake, true, address(0));

        // Emit the GameCreated event
        emit GameCreated(gameCount, msg.sender, _stake);
    }

    // Join an open game
    function joinGame(uint256 _gameId) public {
        Game storage game = games[_gameId];
        require(game.isActive, "Game is not active");
        require(game.player2 == address(0), "Game already has a second player");
        require(msg.sender != game.player1, "Player cannot join their own game");
        require(token.transferFrom(msg.sender, address(this), game.stake), "Stake transfer failed");

        // Assign player2
        game.player2 = msg.sender;

        // Emit the GameJoined event
        emit GameJoined(_gameId, msg.sender);
    }

    // End the game and reward the winner
    function endGame(uint256 _gameId, address _winner) public {
        Game storage game = games[_gameId];
        require(game.isActive, "Game is not active");
        require(_winner == game.player1 || _winner == game.player2, "Invalid winner address");

        // End the game and mark it inactive
        game.isActive = false;
        game.winner = _winner;

        // Transfer the total stake to the winner
        uint256 totalStake = game.stake * 2;
        require(token.transfer(_winner, totalStake), "Reward transfer failed");

        // Emit the GameEnded event
        emit GameEnded(_gameId, _winner);
    }
}
