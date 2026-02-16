// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface INooriVault {
    // Account Management
    function register(string memory masterPassword, string memory recoveryKey) external returns(uint256);
    function generateMemo() external returns (string memory);
    
    // Vault Operations
    function deposit(uint256 assets, address receiver) external returns (uint256);
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256);
    function mint(uint256 shares, address receiver) external returns (uint256);
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256);
    
    // Native Token Operations
    function depositNative() external payable;
    function withdrawNative(uint256 amount) external;
    function transferNative(address to, uint256 amount, string memory memo) external;
    
    // ERC20 Operations
    function depositToken(address token, uint256 amount) external;
    function withdrawToken(address token, uint256 amount) external;
    function transferToken(address token, address to, uint256 amount, string memory memo) external;
    
    // View Functions
    function getNativeBalance(address user) external view returns (uint256);
    function getTokenBalance(address user, address token) external view returns (uint256);
    function getDepositRate() external view returns (uint256);
    function getBorrowRate() external view returns (uint256);
    function getTransferFee() external pure returns (uint256);
    function getWithdrawalFee() external pure returns (uint256);
    function getMinCollateralRatio() external view returns (uint256);
    
    // Events
    event AccountRegistered(address indexed wallet, uint256 id);
    event MemoGenerated(uint256 id, string memo);
    event TransactionRecorded(uint256 id, string memo, uint256 amount, string timestamp);
    event NativeDeposit(address indexed user, uint256 amount);
    event NativeWithdraw(address indexed user, uint256 amount);
    event MultiAssetDeposit(address indexed user, address indexed token, uint256 amount);
    event MultiAssetWithdraw(address indexed user, address indexed token, uint256 amount);
}