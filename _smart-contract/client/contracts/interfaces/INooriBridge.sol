// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface INooriBridge {
    // Cross-chain Operations
    function lockTokens(uint256 amount, string calldata targetChain, address targetAddress) external;
    function burnTokens(uint256 amount, string calldata targetChain, address targetAddress) external;
    function mintTokens(address to, uint256 amount, string calldata sourceChain, bytes32 transactionHash) external returns (bool);
    function releaseTokens(address to, uint256 amount, string calldata sourceChain, bytes32 transactionHash) external;
    
    // Transfer Operations
    function initiateTransfer(address to, uint256 amount) external;
    function executeDelayedTransfer(bytes32 transferId) external;
    function sendTokens(uint16 targetChainId, address targetAddress, uint256 amount) external payable;
    
    // Chain Management
    function registerChain(uint16 chainId, address remoteBridge, bool enabled) external;
    function toggleChain(uint16 chainId, bool enabled) external;
    function setMinGasForTransfer(uint256 _minGasForTransfer) external;
    
    // Security Functions
    function setBlockedAddress(address account, bool blocked) external;
    function processDelayedTransfer(bytes32 transferId) external;
    function retryPayload(uint16 _srcChainId, bytes calldata _srcAddress, bytes calldata _payload) external;
    
    // Events
    event TokenLocked(address indexed user, uint256 amount, string targetChain, address targetAddress);
    event TokenMinted(address indexed user, uint256 amount, string sourceChain, bytes32 transactionHash);
    event TokenUpdated(address newAddress);
    event TransferDelayed(bytes32 indexed transferId, address indexed recipient, uint256 amount);
    event ChainRegistered(uint16 indexed chainId, address remoteBridge);
    event ChainToggled(uint16 indexed chainId, bool enabled);
    event CrossChainTransferInitiated(address indexed from, uint16 targetChainId, address targetAddress, uint256 amount);
}