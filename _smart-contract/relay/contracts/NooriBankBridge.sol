// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./lib.sol";

// Example integration with LayerZero or similar
contract NooriBankBridge is 
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable, 
    UUPSUpgradeable,
    ILayerZeroReceiver 
{
    INooriToken public token;

    mapping(bytes32 => bool) public processedHashes;
    
    uint16 public constant SOURCE_CHAIN_ID = 1; // Ethereum
    mapping(uint16 => address) public remoteBridges; // Remote bridge addresses by chainId
    ILayerZeroEndpoint public endpoint;

    uint256 public constant DELAY_PERIOD = 24 hours;
    uint256 public constant LARGE_TRANSFER_THRESHOLD = 100000 * 1e18;
    
    mapping(bytes32 => PendingTransfer) public pendingTransfers;
    
    struct PendingTransfer {
        address recipient;
        uint256 amount;
        uint256 timestamp;
        bool processed;
    }
    
    event TokenLocked(address indexed user, uint256 amount, string targetChain, address targetAddress);
    event TokenMinted(address indexed user, uint256 amount, string sourceChain, bytes32 transactionHash);
    event TokenUpdated(address newAddress);
    event TransferDelayed(bytes32 indexed transferId, address indexed recipient, uint256 amount);
    event ChainRegistered(uint16 indexed chainId, address remoteBridge);
    event ChainToggled(uint16 indexed chainId, bool enabled);
    event BridgeInitialized(address token, uint16 sourceChainId);
    event CrossChainTransferInitiated(address indexed from, uint16 targetChainId, address targetAddress, uint256 amount);

    struct ChainSupport {
        address remoteBridge;
        bool enabled;
    }

    mapping(uint16 => ChainSupport) public supportedChains;
    uint256 public minGasForTransfer;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(
        address _token,
        address _endpoint,
        uint256 _minGasForTransfer
    ) external initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        
        require(_token != address(0), "Invalid token address");
        require(_endpoint != address(0), "Invalid endpoint address");
        require(_minGasForTransfer > 0, "Invalid min gas value");
        
        token = INooriToken(_token);
        endpoint = ILayerZeroEndpoint(_endpoint);
        minGasForTransfer = _minGasForTransfer;
        
        emit BridgeInitialized(_token, SOURCE_CHAIN_ID);
    }

    // Lock tokens on the source chain
    function lockTokens(uint256 amount, string calldata targetChain, address targetAddress) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit TokenLocked(msg.sender, amount, targetChain, targetAddress);
    }

    // Burn tokens on the target chain
    function burnTokens(uint256 amount, string calldata targetChain, address targetAddress) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        token.burnFrom(msg.sender, amount);
        emit TokenLocked(msg.sender, amount, targetChain, targetAddress);
    }

    // Mint tokens on the target chain
    function mintTokens(address to, uint256 amount, string calldata sourceChain, bytes32 transactionHash) external onlyOwner nonReentrant returns (bool) {
        require(!processedHashes[transactionHash], "Transaction already processed");
        require(to != address(0), "Invalid target address");
        require(amount <= LARGE_TRANSFER_THRESHOLD, "Amount exceeds threshold");
        
        processedHashes[transactionHash] = true;
        bool success = token.mintTo(to, amount);
        emit TokenMinted(to, amount, sourceChain, transactionHash);

        return success;
    }

    // Release tokens on the source chain
    function releaseTokens(address to, uint256 amount, string calldata sourceChain, bytes32 transactionHash) external onlyOwner nonReentrant {
        require(!processedHashes[transactionHash], "Transaction already processed");
        processedHashes[transactionHash] = true;
        require(token.transfer(to, amount), "Transfer failed");
        emit TokenMinted(to, amount, sourceChain, transactionHash);
    }    
    
    // update token address
    function updateToken(address newAddress) external onlyOwner nonReentrant {
        require(newAddress != address(0), "Invalid token address");
        token = INooriToken(newAddress);
        emit TokenUpdated(newAddress);
    }

    function initiateTransfer(address to, uint256 amount) external nonReentrant {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        if (amount >= LARGE_TRANSFER_THRESHOLD) {
            bytes32 transferId = keccak256(abi.encode(to, amount, block.timestamp));
            pendingTransfers[transferId] = PendingTransfer({
                recipient: to,
                amount: amount,
                timestamp: block.timestamp,
                processed: false
            });
            emit TransferDelayed(transferId, to, amount);
        } else {
            _executeTransfer(to, amount);
        }
    }
    
    function executeDelayedTransfer(bytes32 transferId) external onlyOwner {
        PendingTransfer storage transfer = pendingTransfers[transferId];
        require(transfer.timestamp + DELAY_PERIOD <= block.timestamp, "Delay period not elapsed");
        require(!transfer.processed, "Transfer already processed");
        
        transfer.processed = true;
        _executeTransfer(transfer.recipient, transfer.amount);
    }

    function registerChain(
        uint16 chainId,
        address remoteBridge,
        bool enabled
    ) external onlyOwner {
        require(remoteBridge != address(0), "Invalid remote bridge");
        require(chainId != SOURCE_CHAIN_ID, "Cannot register source chain");
        
        supportedChains[chainId] = ChainSupport({
            remoteBridge: remoteBridge,
            enabled: enabled
        });
        
        emit ChainRegistered(chainId, remoteBridge);
        if (enabled) {
            emit ChainToggled(chainId, true);
        }
    }

    function toggleChain(uint16 chainId, bool enabled) external onlyOwner {
        require(supportedChains[chainId].remoteBridge != address(0), "Chain not registered");
        supportedChains[chainId].enabled = enabled;
        emit ChainToggled(chainId, enabled);
    }

    function setMinGasForTransfer(uint256 _minGasForTransfer) external onlyOwner {
        minGasForTransfer = _minGasForTransfer;
    }

    // Security function to block malicious addresses
    mapping(address => bool) public blockedAddresses;

    function setBlockedAddress(address account, bool blocked) external onlyOwner {
        blockedAddresses[account] = blocked;
    }

    modifier notBlocked(address account) {
        require(!blockedAddresses[account], "Address is blocked");
       _;
    }    function sendTokens(
        uint16 targetChainId,
        address targetAddress,
        uint256 amount
    ) external payable nonReentrant notBlocked(msg.sender) notBlocked(targetAddress) {
        require(amount > 0, "Amount must be greater than 0");
        require(supportedChains[targetChainId].remoteBridge != address(0), "Chain not supported");
        require(supportedChains[targetChainId].enabled, "Chain bridge is disabled");
        require(msg.value >= minGasForTransfer, "Insufficient gas provided");
        
        // Lock or burn tokens
        token.burnFrom(msg.sender, amount);
        emit CrossChainTransferInitiated(msg.sender, targetChainId, targetAddress, amount);
        
        // Send cross-chain message
        bytes memory payload = abi.encode(targetAddress, amount);
        endpoint.send{value: msg.value}(
            targetChainId,
            abi.encodePacked(supportedChains[targetChainId].remoteBridge),
            payload,
            payable(msg.sender),
            address(0),
            bytes("")
        );
    }

    // Internal function to execute transfers
    function _executeTransfer(address to, uint256 amount) internal {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(!blockedAddresses[to], "Recipient is blocked");
        
        bool success = token.mintTo(to, amount);
        require(success, "Transfer failed");
        
        emit TokenMinted(
            to,
            amount,
            "local-transfer",
            keccak256(abi.encodePacked(block.timestamp, to, amount))
        );
    }

    // ILayerZeroReceiver implementation
    function lzReceive(
        uint16 _srcChainId,
        bytes calldata _srcAddress,
        uint64 _nonce,
        bytes calldata _payload
    ) external override {
        require(msg.sender == address(endpoint), "Invalid endpoint caller");
        require(supportedChains[_srcChainId].enabled, "Chain not supported");
        
        address srcBridge = address(bytes20(_srcAddress));
        require(srcBridge == supportedChains[_srcChainId].remoteBridge, "Invalid source bridge");
        
        (address toAddress, uint256 amount) = abi.decode(_payload, (address, uint256));
        require(toAddress != address(0), "Invalid recipient");
        
        if (amount > LARGE_TRANSFER_THRESHOLD) {
            // For large transfers, delay the minting
            bytes32 transferId = keccak256(abi.encodePacked(
                _srcChainId,
                _srcAddress,
                _nonce,
                toAddress,
                amount
            ));
            
            pendingTransfers[transferId] = PendingTransfer({
                recipient: toAddress,
                amount: amount,
                timestamp: block.timestamp,
                processed: false
            });
            
            emit TransferDelayed(transferId, toAddress, amount);
        } else {
            // For normal transfers, mint immediately
            require(token.mintTo(toAddress, amount), "Minting failed");
            emit TokenMinted(
                toAddress,
                amount,
                string(abi.encodePacked("chain-", _srcChainId)),
                bytes32(uint256(_nonce))
            );
        }
    }

    function processDelayedTransfer(bytes32 transferId) external onlyOwner nonReentrant {
        PendingTransfer storage transfer = pendingTransfers[transferId];
        require(transfer.recipient != address(0), "Transfer not found");
        require(!transfer.processed, "Transfer already processed");
        require(
            block.timestamp >= transfer.timestamp + DELAY_PERIOD,
            "Delay period not elapsed"
        );
        
        transfer.processed = true;
        require(token.mintTo(transfer.recipient, transfer.amount), "Minting failed");
        
        emit TokenMinted(
            transfer.recipient,
            transfer.amount,
            "delayed-transfer",
            transferId
        );
    }    
    
    function retryPayload(
        uint16 _srcChainId,
        bytes calldata _srcAddress,
        bytes calldata /* _payload */
    ) external onlyOwner {
        endpoint.forceResumeReceive(_srcChainId, _srcAddress);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // Allow recovery of any accidentally sent tokens    
    function rescueTokens(address tokenAddress, uint256 amount) external onlyOwner {
        require(tokenAddress != address(token), "Cannot rescue bridge token");
        IERC20(tokenAddress).transfer(owner(), amount);
    }
}
