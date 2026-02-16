// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

interface IVerifier {
    function verify(bytes calldata proof) external pure returns (bool);
}

/**
 * @title DidItMeKYC
 * @dev KYC service contract that manages user verification and identity proofs
 */
contract DidItMeKYC is UUPSUpgradeable, AccessControlUpgradeable {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // User verification status
    mapping(address => bool) public isVerified;
    
    // KYC level (0: none, 1: basic, 2: advanced)
    mapping(address => uint8) public kycLevel;
    
    // Transaction limits per KYC level
    mapping(uint8 => uint256) public txLimits;
    
    // Cumulative transaction volume
    mapping(address => uint256) public txVolume;
    
    // Verification timestamps
    mapping(address => uint256) public verificationTime;
    
    // Verification expiry (in seconds)
    uint256 public verificationValidity;
    
    event UserVerified(address indexed user, uint8 level);
    event VerificationRevoked(address indexed user);
    event TxLimitUpdated(uint8 level, uint256 limit);
    event TxVolumeUpdated(address indexed user, uint256 volume);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        // Set default verification validity to 1 year
        verificationValidity = 365 days;
        
        // Set default transaction limits
        txLimits[0] = 1000 * 10**18;  // Unverified: 1,000 tokens
        txLimits[1] = 50000 * 10**18;  // Basic: 50,000 tokens
        txLimits[2] = 1000000 * 10**18; // Advanced: 1,000,000 tokens
    }

    function verifyUser(
        address user,
        uint8 level,
        bytes calldata proof
    ) external onlyRole(VERIFIER_ROLE) {
        require(level > 0 && level <= 2, "Invalid KYC level");
        require(IVerifier(msg.sender).verify(proof), "Invalid proof");
        
        isVerified[user] = true;
        kycLevel[user] = level;
        verificationTime[user] = block.timestamp;
        
        emit UserVerified(user, level);
    }

    function revokeVerification(address user) external onlyRole(VERIFIER_ROLE) {
        isVerified[user] = false;
        kycLevel[user] = 0;
        verificationTime[user] = 0;
        
        emit VerificationRevoked(user);
    }

    function updateTxLimit(uint8 level, uint256 limit) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(level <= 2, "Invalid KYC level");
        txLimits[level] = limit;
        
        emit TxLimitUpdated(level, limit);
    }

    function updateTxVolume(address user, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        txVolume[user] += amount;
        
        emit TxVolumeUpdated(user, txVolume[user]);
    }

    function checkVerificationStatus(address user) external view returns (bool) {
        if (!isVerified[user]) return false;
        
        return block.timestamp - verificationTime[user] <= verificationValidity;
    }

    function checkTransactionLimit(address user, uint256 amount) external view returns (bool) {
        uint8 level = kycLevel[user];
        return txVolume[user] + amount <= txLimits[level];
    }

    function setVerificationValidity(uint256 validity) external onlyRole(DEFAULT_ADMIN_ROLE) {
        verificationValidity = validity;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}