// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract RewardToken is ERC20 {
    address public admin;

    constructor() ERC20("BOSMToken", "BOSM") {
        admin = msg.sender;
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    // For simplicity in this academic prototype, we allow any caller
    // to mint via the RewardDistributor contract.
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
