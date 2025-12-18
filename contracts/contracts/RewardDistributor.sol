// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRewardToken {
    function mint(address to, uint256 amount) external;
}

contract RewardDistributor {
    address public admin;
    IRewardToken public token;

    event Rewarded(address indexed user, uint256 amount, uint256 postId);

    constructor(address tokenAddress) {
        admin = msg.sender;
        token = IRewardToken(tokenAddress);
    }

    function award(address user, uint256 amount, uint256 postId) external {
        require(msg.sender == admin, "only admin");
        token.mint(user, amount);
        emit Rewarded(user, amount, postId);
    }
}
