// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/INooriToken.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title TokenHandler
 * @dev Handles token-related operations for the client layer
 */
contract TokenHandler is ReentrancyGuardUpgradeable, OwnableUpgradeable {
    INooriToken public token;
    
    event TokenOperationSuccess(address indexed user, string operation, uint256 amount);
    event TokenOperationFailed(address indexed user, string operation, string reason);
    event RoleOperationSuccess(address indexed target, string role, bool status);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(address _token) external initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        token = INooriToken(_token);
    }
    
    // Transfer Operations
    function transfer(address to, uint256 amount) external nonReentrant {
        try token.transfer(to, amount) returns (bool success) {
            require(success, "Transfer failed");
            emit TokenOperationSuccess(msg.sender, "transfer", amount);
        } catch Error(string memory reason) {
            emit TokenOperationFailed(msg.sender, "transfer", reason);
            revert(reason);
        }
    }
    
    function transferFrom(address from, address to, uint256 amount) external nonReentrant {
        try token.transferFrom(from, to, amount) returns (bool success) {
            require(success, "TransferFrom failed");
            emit TokenOperationSuccess(msg.sender, "transferFrom", amount);
        } catch Error(string memory reason) {
            emit TokenOperationFailed(msg.sender, "transferFrom", reason);
            revert(reason);
        }
    }
    
    // Role Management
    function setMinter(address minter, bool status) external nonReentrant {
        try token.setMinter(minter, status) {
            emit RoleOperationSuccess(minter, "minter", status);
        } catch Error(string memory reason) {
            emit TokenOperationFailed(msg.sender, "setMinter", reason);
            revert(reason);
        }
    }
    
    function setPauser(address pauser, bool status) external nonReentrant {
        try token.setPauser(pauser, status) {
            emit RoleOperationSuccess(pauser, "pauser", status);
        } catch Error(string memory reason) {
            emit TokenOperationFailed(msg.sender, "setPauser", reason);
            revert(reason);
        }
    }
    
    // Account Management
    function blacklist(address account) external nonReentrant {
        try token.blacklist(account) {
            emit TokenOperationSuccess(account, "blacklist", 0);
        } catch Error(string memory reason) {
            emit TokenOperationFailed(msg.sender, "blacklist", reason);
            revert(reason);
        }
    }
    
    function unblacklist(address account) external nonReentrant {
        try token.unblacklist(account) {
            emit TokenOperationSuccess(account, "unblacklist", 0);
        } catch Error(string memory reason) {
            emit TokenOperationFailed(msg.sender, "unblacklist", reason);
            revert(reason);
        }
    }
    
    function freezeAccount(address account) external nonReentrant {
        try token.freezeAccount(account) {
            emit TokenOperationSuccess(account, "freeze", 0);
        } catch Error(string memory reason) {
            emit TokenOperationFailed(msg.sender, "freeze", reason);
            revert(reason);
        }
    }
    
    function unfreezeAccount(address account) external nonReentrant {
        try token.unfreezeAccount(account) {
            emit TokenOperationSuccess(account, "unfreeze", 0);
        } catch Error(string memory reason) {
            emit TokenOperationFailed(msg.sender, "unfreeze", reason);
            revert(reason);
        }
    }
    
    // View Functions
    function isFrozen(address account) external view returns (bool) {
        return token.isFrozen(account);
    }
    
    // Emergency Functions
    function updateToken(address newToken) external onlyOwner {
        token = INooriToken(newToken);
    }
    
    function pause() external nonReentrant {
        try token.pause() {
            emit TokenOperationSuccess(address(0), "pause", 0);
        } catch Error(string memory reason) {
            emit TokenOperationFailed(msg.sender, "pause", reason);
            revert(reason);
        }
    }
    
    function unpause() external nonReentrant {
        try token.unpause() {
            emit TokenOperationSuccess(address(0), "unpause", 0);
        } catch Error(string memory reason) {
            emit TokenOperationFailed(msg.sender, "unpause", reason);
            revert(reason);
        }
    }
}