// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/INooriVault.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title VaultHandler
 * @dev Handles all vault-related operations for the client layer
 */
contract VaultHandler is ReentrancyGuardUpgradeable, OwnableUpgradeable {
    INooriVault public vault;
    
    event VaultOperationSuccess(address indexed user, string operation, uint256 amount);
    event VaultOperationFailed(address indexed user, string operation, string reason);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(address _vault) external initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        vault = INooriVault(_vault);
    }
    
    // Account Operations
    function register(string memory masterPassword, string memory recoveryKey) 
        external 
        nonReentrant 
        returns (uint256) 
    {
        try vault.register(masterPassword, recoveryKey) returns (uint256 id) {
            emit VaultOperationSuccess(msg.sender, "register", id);
            return id;
        } catch Error(string memory reason) {
            emit VaultOperationFailed(msg.sender, "register", reason);
            revert(reason);
        }
    }
    
    function generateMemo() 
        external 
        nonReentrant 
        returns (string memory) 
    {
        try vault.generateMemo() returns (string memory memo) {
            emit VaultOperationSuccess(msg.sender, "generateMemo", 0);
            return memo;
        } catch Error(string memory reason) {
            emit VaultOperationFailed(msg.sender, "generateMemo", reason);
            revert(reason);
        }
    }
    
    // Deposit Operations
    function deposit(uint256 assets) 
        external 
        nonReentrant 
        returns (uint256) 
    {
        try vault.deposit(assets, msg.sender) returns (uint256 shares) {
            emit VaultOperationSuccess(msg.sender, "deposit", assets);
            return shares;
        } catch Error(string memory reason) {
            emit VaultOperationFailed(msg.sender, "deposit", reason);
            revert(reason);
        }
    }
    
    // Native Token Operations
    function depositNative() 
        external 
        payable 
        nonReentrant 
    {
        try vault.depositNative{value: msg.value}() {
            emit VaultOperationSuccess(msg.sender, "depositNative", msg.value);
        } catch Error(string memory reason) {
            emit VaultOperationFailed(msg.sender, "depositNative", reason);
            revert(reason);
        }
    }
    
    function withdrawNative(uint256 amount) 
        external 
        nonReentrant 
    {
        try vault.withdrawNative(amount) {
            emit VaultOperationSuccess(msg.sender, "withdrawNative", amount);
        } catch Error(string memory reason) {
            emit VaultOperationFailed(msg.sender, "withdrawNative", reason);
            revert(reason);
        }
    }
    
    // ERC20 Operations
    function depositToken(address token, uint256 amount) 
        external 
        nonReentrant 
    {
        try vault.depositToken(token, amount) {
            emit VaultOperationSuccess(msg.sender, "depositToken", amount);
        } catch Error(string memory reason) {
            emit VaultOperationFailed(msg.sender, "depositToken", reason);
            revert(reason);
        }
    }
    
    function withdrawToken(address token, uint256 amount) 
        external 
        nonReentrant 
    {
        try vault.withdrawToken(token, amount) {
            emit VaultOperationSuccess(msg.sender, "withdrawToken", amount);
        } catch Error(string memory reason) {
            emit VaultOperationFailed(msg.sender, "withdrawToken", reason);
            revert(reason);
        }
    }
    
    // View Functions
    function getBalances(address user, address[] calldata tokens) 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256[] memory balances = new uint256[](tokens.length + 1);
        balances[0] = vault.getNativeBalance(user);
        
        for(uint i = 0; i < tokens.length; i++) {
            balances[i + 1] = vault.getTokenBalance(user, tokens[i]);
        }
        
        return balances;
    }
    
    function getFees() 
        external 
        view 
        returns (uint256 transfer, uint256 withdrawal) 
    {
        return (vault.getTransferFee(), vault.getWithdrawalFee());
    }
    
    function getRates() 
        external 
        view 
        returns (uint256 deposit, uint256 borrow, uint256 collateral) 
    {
        return (
            vault.getDepositRate(),
            vault.getBorrowRate(),
            vault.getMinCollateralRatio()
        );
    }
    
    // Emergency Functions
    function updateVault(address newVault) external onlyOwner {
        vault = INooriVault(newVault);
    }
    
    receive() external payable {
        revert("Use depositNative() instead");
    }
}