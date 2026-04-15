// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ContentPayment is Ownable {
    IERC20 public usdt;
    uint256 public constant COMMISSION_BPS = 500;
    uint256 public constant BPS_BASE = 10000;

    event Payment(
        address indexed buyer,
        address indexed author,
        uint256 amount,
        uint256 commission
    );

    constructor(address _usdt) Ownable(msg.sender) {
        usdt = IERC20(_usdt);
    }

    function pay(address author, uint256 amount) external {
        require(author != address(0), "invalid author");
        require(amount > 0, "zero amount");

        uint256 commission = (amount * COMMISSION_BPS) / BPS_BASE;
        uint256 authorAmount = amount - commission;

        usdt.transferFrom(msg.sender, owner(), commission);
        usdt.transferFrom(msg.sender, author, authorAmount);

        emit Payment(msg.sender, author, amount, commission);
    }
}
