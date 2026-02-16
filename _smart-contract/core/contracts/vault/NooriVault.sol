// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { ERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { ERC4626Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "./lib.sol";

/**
 * @title NooriVault
 * @dev ERC4626-compliant vault with daily compound interest, fee structure, and security features
 */
contract NooriBankVault is 
    ERC4626Upgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable 
{
    using StringsUpgradeable for uint256;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    // Constants
    uint256 private constant SECONDS_PER_DAY = 86400;
    uint256 private constant APR = 1000; // 10.00%
    uint256 private constant WITHDRAWAL_FEE = 50; // 0.50%
    uint256 private constant TRANSFER_FEE = 10; // 0.10%
    uint256 private constant GAS_FEE = 20; // 0.20% in primary token
    uint256 private constant FEE_DENOMINATOR = 10000; // 100.00%
    uint256 private constant KYC_REQUIRED_SINGLE_TX_LIMIT = 200000 * 10**18;
    uint256 private constant KYC_REQUIRED_TOTAL_TX_LIMIT = 1000000 * 10**18;
    address private constant NATIVE = address(0);

    // Structs
    struct Account {
        uint256 id;
        address wallet;
        bytes32 masterPasswordHash;
        bytes32 recoveryKeyHash;
        string[] memos;
        uint256 lastInterestTimestamp;
        bool kycVerified;
        uint256 totalTransactionVolume;
        mapping(address => uint256) tokenBalances; // Balance per token (address(0) for native)
    }

    struct TransactionHistory {
        uint256 id;
        address wallet;
        string memo;
        address to;
        address from;
        string txType;
        string asset;
        string timestamp;
        uint256 amount;
    }

    // State variables
    uint256 private lastInterestUpdate;
    uint256 private totalInterestAccrued;
    uint256 private accountIdCounter;
    uint256 private transactionCounter;

    IDidItMe public kycService;
    mapping(address => Account) private accounts;
    mapping(string => address) private memoToAccount;
    mapping(address => AggregatorV3Interface) public assetPriceFeeds;
    TransactionHistory[] private transactionRecords;

    // Additional State variables
    mapping(address => mapping(address => uint256)) private userTokenBalances; // user => token => balance
    mapping(address => bool) public supportedTokens; // List of supported tokens
    IERC20 public primaryToken; // The token used for gas fees
    
    // System Parameters (scaled by TOKEN_DECIMALS)
    uint256 private depositRate;      // Annual deposit interest rate 
    uint256 private borrowRate;       // Annual borrow interest rate
    uint256 private minCollateralRatio; // Minimum collateral ratio required
    
    // Fee structure (in basis points, 1% = 100)
    uint256 private constant TOKEN_DECIMALS = 18;  // Decimals for our primary token
    uint256 private constant BASIS_POINTS = 10000; // 100% = 10000 basis points
    
    // Events for parameter updates
    event DepositRateUpdated(uint256 newRate);
    event BorrowRateUpdated(uint256 newRate);
    event MinCollateralRatioUpdated(uint256 newRatio);
    
    // Events
    event InterestAccrued(uint256 amount, uint256 timestamp);
    event AccountRegistered(address indexed wallet, uint256 id);
    event MemoGenerated(uint256 id, string memo);
    event TransactionRecorded(uint256 id, string memo, uint256 amount, string timestamp);
    event KYCServiceUpdated(address _kycService);
    event KYCVerified(string statement, bool verified);
    event PriceFeedSet(address priceFeed);
    event TokenAdded(address indexed token);
    event TokenRemoved(address indexed token);
    event MultiAssetDeposit(address indexed user, address indexed token, uint256 amount);
    event MultiAssetWithdraw(address indexed user, address indexed token, uint256 amount);
    event NativeDeposit(address indexed user, uint256 amount);
    event NativeWithdraw(address indexed user, uint256 amount);
    event NativeTransfer(
        address indexed from, 
        address indexed to, 
        uint256 amount, 
        uint256 fee
    );
    event TokenTransfer(
        address indexed from, 
        address indexed to, 
        address indexed token,
        uint256 amount, 
        uint256 fee
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the vault
     */
    function initialize(
        IERC20 asset_,
        string memory name_,
        string memory symbol_,
        address kycService_
    ) public initializer {
        // Initialize in correct order: ERC20, ERC4626, other contracts
        __ERC20_init(name_, symbol_);
        __ERC4626_init(asset_);
        __ReentrancyGuard_init();
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);

        lastInterestUpdate = block.timestamp;
        kycService = IDidItMe(kycService_);
        primaryToken = asset_; // Set the primary token for gas fees
        supportedTokens[address(asset_)] = true; // Add primary token as supported
    }

    // Account Management Functions

    function register(string memory masterPassword, string memory recoveryKey) 
        external 
        whenNotPaused 
        returns(uint256)
    {
        require(accounts[msg.sender].wallet == address(0), "Account exists");
        require(bytes(masterPassword).length >= 8, "Password too short");
        require(bytes(recoveryKey).length >= 8, "Recovery key too short");

        accountIdCounter++;

        accounts[msg.sender] = Account({
            id: accountIdCounter,
            wallet: msg.sender,
            masterPasswordHash: keccak256(abi.encodePacked(masterPassword)),
            recoveryKeyHash: keccak256(abi.encodePacked(recoveryKey)),
            memos: new string[](0),
            lastInterestTimestamp: block.timestamp,
            kycVerified: false,
            totalTransactionVolume: 0
        });

        emit AccountRegistered(msg.sender, accountIdCounter);
        return accountIdCounter;
    }

    function generateMemo() 
        external 
        whenNotPaused 
        returns (string memory) 
    {
        require(accounts[msg.sender].wallet != address(0), "Account required");
        Account storage account = accounts[msg.sender];
        
        string memory memo = string(
            abi.encodePacked(
                "MEMO-", 
                account.id.toString(), 
                "-", 
                block.timestamp.toString()
            )
        );
        
        account.memos.push(memo);
        memoToAccount[memo] = msg.sender;
        
        emit MemoGenerated(account.id, memo);
        return memo;
    }

    // ERC4626 Overrides with Fees and Interest

    function deposit(uint256 assets, address receiver)
        public
        virtual
        override
        whenNotPaused
        nonReentrant
        returns (uint256)
    {
        require(_isValidDeposit(assets), "KYC required");
        _accrueInterest();
        return super.deposit(assets, receiver);
    }

    function mint(uint256 shares, address receiver)
        public
        virtual
        override
        whenNotPaused
        nonReentrant
        returns (uint256)
    {
        uint256 assets = previewMint(shares);
        require(_isValidDeposit(assets), "KYC required");
        _accrueInterest();
        return super.mint(shares, receiver);
    }    
    
    function withdraw(uint256 assets, address receiver, address owner)
        public
        virtual
        override
        whenNotPaused
        nonReentrant
        returns (uint256)
    {
        require(_isValidWithdrawal(assets, owner), "KYC required");
        _accrueInterest();
        
        uint256 fee = (assets * WITHDRAWAL_FEE) / FEE_DENOMINATOR;
        uint256 netAmount = assets - fee;
        
        _recordTransaction(
            owner,
            receiver,
            assets,
            "withdraw",
            "NOORI",
            "Withdrawal"
        );
        
        return super.withdraw(netAmount, receiver, owner);
    }    
    
    function redeem(uint256 shares, address receiver, address owner)
        public
        virtual
        override
        whenNotPaused
        nonReentrant
        returns (uint256)
    {
        uint256 assets = previewRedeem(shares);
        require(_isValidWithdrawal(assets, owner), "KYC required");
        _accrueInterest();
          uint256 fee = (assets * WITHDRAWAL_FEE) / FEE_DENOMINATOR;
        uint256 netAmount = assets - fee;
        
        _recordTransaction(
            owner,
            receiver,
            assets,
            "redeem",
            "NOORI",
            "Redemption"
        );
        
        // Pass netAmount to super.redeem to account for fees
        return super.redeem((shares * netAmount) / assets, receiver, owner);
    }    
    
    function transfer(address to, uint256 amount)
        public
        virtual
        override(ERC20Upgradeable, IERC20)
        whenNotPaused
        nonReentrant
        returns (bool)
    {
        require(_isValidTransfer(amount), "KYC required");
        _accrueInterest();
        
        uint256 fee = (amount * TRANSFER_FEE) / FEE_DENOMINATOR;
        uint256 netAmount = amount - fee;
        
        _recordTransaction(
            msg.sender,
            to,
            amount,
            "transfer",
            "NOORI",
            "Transfer"
        );
        
        return super.transfer(to, netAmount);
    }

    // Interest Calculation      
    function _accrueInterest() internal {
        uint256 timePassed = block.timestamp - lastInterestUpdate;        if (timePassed >= SECONDS_PER_DAY) {            
            uint256 currentAssets = super.totalAssets();
            uint256 dailyRate = (APR * 1e18 / 365) / FEE_DENOMINATOR; // Increased precision
            uint256 daysPassed = timePassed / SECONDS_PER_DAY;
            uint256 compoundInterest = currentAssets;
            
            // Use higher precision math for interest calculation
            for (uint256 i = 0; i < daysPassed; i++) {
                compoundInterest = compoundInterest + ((compoundInterest * dailyRate) / 1e18);
            }
              uint256 interestEarned = compoundInterest - currentAssets;
            totalInterestAccrued = totalInterestAccrued + interestEarned;
            
            lastInterestUpdate = block.timestamp;
            emit InterestAccrued(interestEarned, block.timestamp);
        }
    }

    function totalAssets() 
        public 
        view        
        virtual
        override 
        returns (uint256) 
    {
        return super.totalAssets() + totalInterestAccrued;
    }

    // Internal Helper Functions
    function _recordTransaction(
        address from,
        address to,
        uint256 amount,
        string memory txType,
        string memory asset,
        string memory memo
    ) internal {
        transactionCounter++;
        
        TransactionHistory memory transaction = TransactionHistory({
            id: transactionCounter,
            wallet: from,
            memo: memo,
            to: to,
            from: from,
            txType: txType,
            asset: asset,
            timestamp: block.timestamp.toString(),
            amount: amount
        });
        
        transactionRecords.push(transaction);
          if (accounts[from].wallet != address(0)) {
            accounts[from].totalTransactionVolume += amount;
        }
        
        emit TransactionRecorded(
            transaction.id,
            transaction.memo,
            transaction.amount,
            transaction.timestamp
        );
    }

    function _isValidDeposit(uint256 amount) internal view returns (bool) {
        Account storage account = accounts[msg.sender];
        return account.kycVerified || (
            amount <= KYC_REQUIRED_SINGLE_TX_LIMIT && 
            account.totalTransactionVolume + amount <= KYC_REQUIRED_TOTAL_TX_LIMIT
        );
    }

    function _isValidWithdrawal(uint256 amount, address owner) 
        internal 
        view 
        returns (bool) 
    {
        Account storage account = accounts[owner];
        return account.kycVerified || (
            amount <= KYC_REQUIRED_SINGLE_TX_LIMIT && 
            account.totalTransactionVolume + amount <= KYC_REQUIRED_TOTAL_TX_LIMIT
        );
    }

    function _isValidTransfer(uint256 amount) internal view returns (bool) {
        Account storage account = accounts[msg.sender];
        return account.kycVerified || (
            amount <= KYC_REQUIRED_SINGLE_TX_LIMIT && 
            account.totalTransactionVolume + amount <= KYC_REQUIRED_TOTAL_TX_LIMIT
        );
    }

    // Multi-asset functions
    
    // Native crypto handling
    receive() external payable {
        _depositNative();
    }

    fallback() external payable {
        _depositNative();
    }

    function depositNative() external payable whenNotPaused nonReentrant {
        _depositNative();
    }

    function _depositNative() internal {
        require(_isValidDeposit(msg.value), "KYC required");
        require(msg.value > 0, "Zero deposit");
        
        // Charge gas fee in primary token
        uint256 gasFee = (msg.value * GAS_FEE) / FEE_DENOMINATOR;
        require(primaryToken.transferFrom(msg.sender, address(this), gasFee), "Gas fee transfer failed");
        
        userTokenBalances[msg.sender][NATIVE] += msg.value;
        _recordTransaction(msg.sender, address(this), msg.value, "deposit", "NATIVE", "Native Deposit");
        
        emit NativeDeposit(msg.sender, msg.value);
    }

    function withdrawNative(uint256 amount) external whenNotPaused nonReentrant {
        require(_isValidWithdrawal(amount, msg.sender), "KYC required");
        require(userTokenBalances[msg.sender][NATIVE] >= amount, "Insufficient balance");
        
        // Charge gas fee in primary token
        uint256 gasFee = (amount * GAS_FEE) / FEE_DENOMINATOR;
        uint256 withdrawalFee = (amount * WITHDRAWAL_FEE) / FEE_DENOMINATOR;
        require(primaryToken.transferFrom(msg.sender, address(this), gasFee), "Gas fee transfer failed");
        
        userTokenBalances[msg.sender][NATIVE] -= amount;
        
        uint256 netAmount = amount - withdrawalFee;
        (bool success, ) = payable(msg.sender).call{value: netAmount}("");
        require(success, "Native transfer failed");
        
        _recordTransaction(address(this), msg.sender, amount, "withdraw", "NATIVE", "Native Withdrawal");
        
        emit NativeWithdraw(msg.sender, netAmount);
    }

    // ERC20 Token handling
    function depositToken(address token, uint256 amount) external whenNotPaused nonReentrant {
        require(token != address(primaryToken), "Use standard deposit for primary token");
        require(supportedTokens[token], "Token not supported");
        require(_isValidDeposit(amount), "KYC required");
        require(amount > 0, "Zero deposit");
        
        // Charge gas fee in primary token
        uint256 gasFee = (amount * GAS_FEE) / FEE_DENOMINATOR;
        require(primaryToken.transferFrom(msg.sender, address(this), gasFee), "Gas fee transfer failed");
        
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        userTokenBalances[msg.sender][token] += amount;
        
        _recordTransaction(msg.sender, address(this), amount, "deposit", "ERC20", "Token Deposit");
        
        emit MultiAssetDeposit(msg.sender, token, amount);
    }

    function withdrawToken(address token, uint256 amount) external whenNotPaused nonReentrant {
        require(token != address(primaryToken), "Use standard withdraw for primary token");
        require(supportedTokens[token], "Token not supported");
        require(_isValidWithdrawal(amount, msg.sender), "KYC required");
        require(userTokenBalances[msg.sender][token] >= amount, "Insufficient balance");
        
        // Charge gas fee in primary token
        uint256 gasFee = (amount * GAS_FEE) / FEE_DENOMINATOR;
        uint256 withdrawalFee = (amount * WITHDRAWAL_FEE) / FEE_DENOMINATOR;
        require(primaryToken.transferFrom(msg.sender, address(this), gasFee), "Gas fee transfer failed");
        
        userTokenBalances[msg.sender][token] -= amount;
        uint256 netAmount = amount - withdrawalFee;
        require(IERC20(token).transfer(msg.sender, netAmount), "Token transfer failed");
        
        _recordTransaction(address(this), msg.sender, amount, "withdraw", "ERC20", "Token Withdrawal");
        
        emit MultiAssetWithdraw(msg.sender, token, netAmount);
    }

    // Multi-asset transfer functions    
    function transferNative(address to, uint256 amount, string memory memo) external whenNotPaused nonReentrant {
        require(_isValidTransfer(amount), "KYC required");
        require(userTokenBalances[msg.sender][NATIVE] >= amount, "Insufficient balance");
        require(amount > 0, "Zero amount");

        // First deduct from sender to prevent reentrancy
        userTokenBalances[msg.sender][NATIVE] -= amount;
        
        // Charge gas fee in primary token
        uint256 gasFee = (amount * GAS_FEE) / FEE_DENOMINATOR;
        uint256 transferFee = (amount * TRANSFER_FEE) / FEE_DENOMINATOR;
        require(primaryToken.transferFrom(msg.sender, address(this), gasFee), "Gas fee transfer failed");
        
        uint256 netAmount = amount - transferFee;
        address recipient = memoToAccount[memo];

        if (recipient != address(0)) {
            // Internal transfer - memo exists in our system
            require(recipient != msg.sender, "Self transfer not allowed");
            userTokenBalances[recipient][NATIVE] += netAmount;
            _recordTransaction(msg.sender, recipient, amount, "transfer", "NATIVE", "Internal Native Transfer");
        } else {
            // External transfer - memo should be empty and 'to' should be valid address
            require(bytes(memo).length == 0, "Invalid memo for external transfer");
            require(to != address(0) && to != address(this), "Invalid recipient");
            require(to != msg.sender, "Self transfer not allowed");
            
            (bool success, ) = payable(to).call{value: netAmount}("");
            require(success, "Native transfer failed");
            
            _recordTransaction(msg.sender, to, amount, "transfer", "NATIVE", "External Native Transfer");
        }
        
        emit NativeTransfer(msg.sender, recipient != address(0) ? recipient : to, amount, transferFee);
    }
      
    function transferToken(address token, address to, uint256 amount, string memory memo) external whenNotPaused nonReentrant {
        require(token != address(primaryToken), "Use standard transfer for primary token");
        require(supportedTokens[token], "Token not supported");
        require(_isValidTransfer(amount), "KYC required");
        require(userTokenBalances[msg.sender][token] >= amount, "Insufficient balance");
        require(amount > 0, "Zero amount");

        // First deduct from sender to prevent reentrancy
        userTokenBalances[msg.sender][token] -= amount;
        
        // Charge gas fee in primary token
        uint256 gasFee = (amount * GAS_FEE) / FEE_DENOMINATOR;
        uint256 transferFee = (amount * TRANSFER_FEE) / FEE_DENOMINATOR;
        require(primaryToken.transferFrom(msg.sender, address(this), gasFee), "Gas fee transfer failed");
        
        uint256 netAmount = amount - transferFee;
        address recipient = memoToAccount[memo];

        if (recipient != address(0)) {
            // Internal transfer - memo exists in our system
            require(recipient != msg.sender, "Self transfer not allowed");
            userTokenBalances[recipient][token] += netAmount;
            _recordTransaction(msg.sender, recipient, amount, "transfer", token, "Internal Token Transfer");
        } else {
            // External transfer - memo should be empty and 'to' should be valid address
            require(bytes(memo).length == 0, "Invalid memo for external transfer");
            require(to != address(0) && to != address(this), "Invalid recipient");
            require(to != msg.sender, "Self transfer not allowed");
            
            IERC20 tokenContract = IERC20(token);
            require(tokenContract.transfer(to, netAmount), "Token transfer failed");
            
            _recordTransaction(msg.sender, to, amount, "transfer", token, "External Token Transfer");
        }

        emit TokenTransfer(msg.sender, recipient != address(0) ? recipient : to, token, amount, transferFee);
    }

    // View functions for balances
    function getNativeBalance(address user) external view returns (uint256) {
        return userTokenBalances[user][NATIVE];
    }

    function getTokenBalance(address user, address token) external view returns (uint256) {
        require(supportedTokens[token], "Token not supported");
        return userTokenBalances[user][token];
    }

    // System Parameter Getters
    function getDepositRate() external view returns (uint256) {
        return depositRate;
    }
    
    function getBorrowRate() external view returns (uint256) {
        return borrowRate;
    }
    
    function getTransferFee() external pure returns (uint256) {
        return TRANSFER_FEE;
    }
    
    function getWithdrawalFee() external pure returns (uint256) {
        return WITHDRAWAL_FEE;
    }
    
    function getMinCollateralRatio() external view returns (uint256) {
        return minCollateralRatio;
    }
    
    // Admin functions for token management
    function addSupportedToken(address token) external onlyRole(ADMIN_ROLE) {
        require(token != NATIVE && token != address(primaryToken), "Invalid token");
        require(!supportedTokens[token], "Token already supported");
        supportedTokens[token] = true;
        emit TokenAdded(token);
    }

    function removeSupportedToken(address token) external onlyRole(ADMIN_ROLE) {
        require(supportedTokens[token], "Token not supported");
        supportedTokens[token] = false;
        emit TokenRemoved(token);
    }

    // Admin Functions
    function pause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function setKYCService(address _kycService) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        kycService = IDidItMe(_kycService);
        emit KYCServiceUpdated(_kycService);
    }

    function setPriceFeed(address token, address priceFeed) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        assetPriceFeeds[token] = AggregatorV3Interface(priceFeed);
        emit PriceFeedSet(priceFeed);
    }

    function setDepositRate(uint256 newRate) external onlyRole(ADMIN_ROLE) {
        require(newRate <= 10000, "Rate exceeds 100%"); // Max 100% APR
        depositRate = newRate;
        emit DepositRateUpdated(newRate);
    }
    
    function setBorrowRate(uint256 newRate) external onlyRole(ADMIN_ROLE) {
        require(newRate <= 10000, "Rate exceeds 100%"); // Max 100% APR
        borrowRate = newRate;
        emit BorrowRateUpdated(newRate);
    }
    
    function setMinCollateralRatio(uint256 newRatio) external onlyRole(ADMIN_ROLE) {
        require(newRatio >= 10000, "Ratio below 100%"); // Minimum 100%
        minCollateralRatio = newRatio;
        emit MinCollateralRatioUpdated(newRatio);
    }

    function setPrimaryToken(IERC20 token) external onlyRole(ADMIN_ROLE) {
        primaryToken = token;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}



