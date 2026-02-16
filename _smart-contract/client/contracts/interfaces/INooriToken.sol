// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface INooriToken {
    // Token Operations
    function mint(address to, uint256 amount) external;
    function mintTo(address to, uint256 amount) external returns (bool);
    function burn(uint256 amount) external;
    function burnFrom(address account, uint256 amount) external;
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    
    // Role Management
    function setMinter(address minter, bool status) external;
    function setPauser(address pauser, bool status) external;
    function setAdmin(address newAdmin) external;
    
    // Blacklist Management
    function blacklist(address account) external;
    function unblacklist(address account) external;
    
    // Account Management
    function freezeAccount(address account) external;
    function unfreezeAccount(address account) external;
    function isFrozen(address account) external view returns (bool);
    
    // Bridge Management
    function setBridge(address bridge, bool status) external;
    
    // State Control
    function pause() external;
    function unpause() external;
    
    // Events
    event Mint(address indexed to, uint256 amount);
    event AccountFrozen(address indexed account);
    event AccountUnfrozen(address indexed account);
    event MinterUpdated(address indexed minter, bool status);
    event PauserUpdated(address indexed pauser, bool status);
    event AdminUpdated(address indexed admin);
    event BridgeAuthorized(address indexed bridge, bool status);
}