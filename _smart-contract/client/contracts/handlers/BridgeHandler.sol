// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/INooriBridge.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title BridgeHandler
 * @dev Handles bridge-related operations for the client layer
 */
contract BridgeHandler is ReentrancyGuardUpgradeable, OwnableUpgradeable {
    INooriBridge public bridge;
    
    event BridgeOperationSuccess(
        address indexed user, 
        string operation, 
        uint256 amount,
        string targetChain
    );
    event BridgeOperationFailed(
        address indexed user, 
        string operation, 
        string reason
    );
    event ChainOperationSuccess(
        uint16 indexed chainId,
        string operation,
        bool status
    );
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(address _bridge) external initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        bridge = INooriBridge(_bridge);
    }
    
    // Cross-chain Operations
    function lockTokens(
        uint256 amount, 
        string calldata targetChain, 
        address targetAddress
    ) external nonReentrant {
        try bridge.lockTokens(amount, targetChain, targetAddress) {
            emit BridgeOperationSuccess(
                msg.sender, 
                "lockTokens", 
                amount, 
                targetChain
            );
        } catch Error(string memory reason) {
            emit BridgeOperationFailed(msg.sender, "lockTokens", reason);
            revert(reason);
        }
    }
    
    function burnTokens(
        uint256 amount, 
        string calldata targetChain, 
        address targetAddress
    ) external nonReentrant {
        try bridge.burnTokens(amount, targetChain, targetAddress) {
            emit BridgeOperationSuccess(
                msg.sender, 
                "burnTokens", 
                amount, 
                targetChain
            );
        } catch Error(string memory reason) {
            emit BridgeOperationFailed(msg.sender, "burnTokens", reason);
            revert(reason);
        }
    }
    
    // Transfer Operations
    function initiateTransfer(
        address to, 
        uint256 amount
    ) external nonReentrant {
        try bridge.initiateTransfer(to, amount) {
            emit BridgeOperationSuccess(
                msg.sender, 
                "initiateTransfer", 
                amount, 
                ""
            );
        } catch Error(string memory reason) {
            emit BridgeOperationFailed(msg.sender, "initiateTransfer", reason);
            revert(reason);
        }
    }
    
    function sendTokens(
        uint16 targetChainId,
        address targetAddress,
        uint256 amount
    ) external payable nonReentrant {
        try bridge.sendTokens{value: msg.value}(
            targetChainId,
            targetAddress,
            amount
        ) {
            emit BridgeOperationSuccess(
                msg.sender,
                "sendTokens",
                amount,
                string(abi.encodePacked("chain-", targetChainId))
            );
        } catch Error(string memory reason) {
            emit BridgeOperationFailed(msg.sender, "sendTokens", reason);
            revert(reason);
        }
    }
    
    // Chain Management
    function registerChain(
        uint16 chainId,
        address remoteBridge,
        bool enabled
    ) external nonReentrant {
        try bridge.registerChain(chainId, remoteBridge, enabled) {
            emit ChainOperationSuccess(chainId, "register", enabled);
        } catch Error(string memory reason) {
            emit BridgeOperationFailed(msg.sender, "registerChain", reason);
            revert(reason);
        }
    }
    
    function toggleChain(
        uint16 chainId,
        bool enabled
    ) external nonReentrant {
        try bridge.toggleChain(chainId, enabled) {
            emit ChainOperationSuccess(chainId, "toggle", enabled);
        } catch Error(string memory reason) {
            emit BridgeOperationFailed(msg.sender, "toggleChain", reason);
            revert(reason);
        }
    }
    
    // Security Operations
    function setBlockedAddress(
        address account,
        bool blocked
    ) external nonReentrant {
        try bridge.setBlockedAddress(account, blocked) {
            emit BridgeOperationSuccess(
                account,
                "setBlocked",
                0,
                blocked ? "blocked" : "unblocked"
            );
        } catch Error(string memory reason) {
            emit BridgeOperationFailed(msg.sender, "setBlockedAddress", reason);
            revert(reason);
        }
    }
    
    // Emergency Functions
    function updateBridge(address newBridge) external onlyOwner {
        bridge = INooriBridge(newBridge);
    }
    
    receive() external payable {
        revert("Direct transfers not allowed");
    }
}