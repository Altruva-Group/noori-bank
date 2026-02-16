// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import { ERC20BurnableUpgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title NooriToken
 * @dev ERC20 token for NOORIBANK with upgradeable pattern, role-based access control,
 * pausable functionality and blacklisting capability.
 */
contract NooriToken is 
    ERC20Upgradeable, 
    ERC20BurnableUpgradeable,
    PausableUpgradeable, 
    AccessControlUpgradeable, 
    UUPSUpgradeable,
    OwnableUpgradeable
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant BLACKLISTER_ROLE = keccak256("BLACKLISTER_ROLE");
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    string public currency;
    
    // Mappings
    mapping(address => bool) public blacklisted;
    mapping(address => bool) public authorized_bridges;
    mapping(address => bool) private _frozenAccounts;

    // Events
    event Mint(address indexed to, uint256 amount);
    event Pause(address account);
    event Unpause(address account);
    event AccountFrozen(address indexed account);
    event AccountUnfrozen(address indexed account);
    event MinterUpdated(address indexed minter, bool status);
    event PauserUpdated(address indexed pauser, bool status);
    event AdminUpdated(address indexed admin);
    event BridgeAuthorized(address indexed bridge, bool status);
    event TokensBurned(address indexed from, uint256 amount, string targetChain, address targetAddress);
    event TokensMinted(address indexed to, uint256 amount, string sourceChain, bytes32 transactionHash);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __ERC20_init("NOORI TOKEN", "NOORI");
        __ERC20Burnable_init();
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __Ownable_init(msg.sender);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        _grantRole(BLACKLISTER_ROLE, msg.sender);
        _grantRole(BRIDGE_ROLE, msg.sender);

        currency = "USD";
    }

    // Bridge authorization functions
    modifier onlyBridge() {
        require(hasRole(BRIDGE_ROLE, msg.sender) && authorized_bridges[msg.sender], "Not an authorized bridge");
        _;
    }

    function setBridge(address bridge, bool status) external onlyRole(ADMIN_ROLE) {
        if(status) {
            _grantRole(BRIDGE_ROLE, bridge);
        } else {
            _revokeRole(BRIDGE_ROLE, bridge);
        }
        authorized_bridges[bridge] = status;
        emit BridgeAuthorized(bridge, status);
    }

    // Bridge-specific functions
    function burnFrom(address from, uint256 amount) public override onlyBridge {
        super.burnFrom(from, amount);
    }

    function mintTo(address to, uint256 amount) public onlyBridge returns (bool) {
        require(to != address(0), "NooriToken: mint to the zero address");
        require(amount > 0, "NooriToken: mint amount not greater than 0");
        _mint(to, amount);
        return true;
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(to != address(0), "NooriToken: mint to the zero address");
        require(amount > 0, "NooriToken: mint amount not greater than 0");
        _mint(to, amount);
        emit Mint(to, amount);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
        emit Pause(msg.sender);
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
        emit Unpause(msg.sender);
    }

    // Account freezing functions
    function freezeAccount(address account) public onlyRole(ADMIN_ROLE) {
        _frozenAccounts[account] = true;
        emit AccountFrozen(account);
    }

    function unfreezeAccount(address account) public onlyRole(ADMIN_ROLE) {
        _frozenAccounts[account] = false;
        emit AccountUnfrozen(account);
    }

    function isFrozen(address account) public view returns (bool) {
        return _frozenAccounts[account];
    }

    // Role management functions
    function setMinter(address minter, bool status) public onlyRole(ADMIN_ROLE) {
        if (status) {
            grantRole(MINTER_ROLE, minter);
        } else {
            revokeRole(MINTER_ROLE, minter);
        }
        emit MinterUpdated(minter, status);
    }

    function setPauser(address pauser, bool status) public onlyRole(ADMIN_ROLE) {
        if (status) {
            grantRole(PAUSER_ROLE, pauser);
        } else {
            revokeRole(PAUSER_ROLE, pauser);
        }
        emit PauserUpdated(pauser, status);
    }

    function setAdmin(address newAdmin) public onlyRole(ADMIN_ROLE) {
        grantRole(ADMIN_ROLE, newAdmin);
        emit AdminUpdated(newAdmin);
    }

    function blacklist(address account) public onlyRole(BLACKLISTER_ROLE) {
        blacklisted[account] = true;
    }

    function unblacklist(address account) public onlyRole(BLACKLISTER_ROLE) {
        blacklisted[account] = false;
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal virtual override whenNotPaused {
        require(!blacklisted[from] && !blacklisted[to], "NOORI: account is blacklisted");
        require(!_frozenAccounts[from], "NooriToken: sender account is frozen");
        require(!_frozenAccounts[to], "NooriToken: recipient account is frozen");
        super._update(from, to, value);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {}

    // The following functions are overrides required by Solidity
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId) || 
               interfaceId == type(IERC20).interfaceId;
    }
}
