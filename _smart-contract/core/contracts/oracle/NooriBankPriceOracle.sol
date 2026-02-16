// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title NooriBankPriceOracle
 * @dev Manages price feeds for vault assets using Chainlink oracles
 */
contract NooriBankPriceOracle is UUPSUpgradeable, AccessControlUpgradeable {
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // Asset price feeds
    mapping(address => AggregatorV3Interface) public priceFeeds;
    
    // Asset heartbeat intervals (max time between updates)
    mapping(address => uint256) public heartbeats;
    
    // Last known good price
    mapping(address => uint256) public lastPrices;
    
    // Last update timestamp
    mapping(address => uint256) public lastUpdates;

    event PriceFeedUpdated(address indexed asset, address feed);
    event HeartbeatUpdated(address indexed asset, uint256 interval);
    event PriceUpdated(address indexed asset, uint256 price);
    event StalePrice(address indexed asset, uint256 lastUpdate);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(UPDATER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
    }

    function setPriceFeed(
        address asset,
        address feed,
        uint256 heartbeat
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(feed != address(0), "Invalid feed address");
        require(heartbeat > 0, "Invalid heartbeat");
        
        priceFeeds[asset] = AggregatorV3Interface(feed);
        heartbeats[asset] = heartbeat;
        
        emit PriceFeedUpdated(asset, feed);
        emit HeartbeatUpdated(asset, heartbeat);
    }

    function updatePrice(address asset) external onlyRole(UPDATER_ROLE) {
        AggregatorV3Interface feed = priceFeeds[asset];
        require(address(feed) != address(0), "Feed not found");

        (, int256 price,, uint256 updatedAt,) = feed.latestRoundData();
        require(price >= 0, "Invalid price");

        // Check for stale price
        if (block.timestamp - updatedAt > heartbeats[asset]) {
            emit StalePrice(asset, updatedAt);
            revert("Stale price feed");
        }

        lastPrices[asset] = uint256(price);
        lastUpdates[asset] = updatedAt;
        
        emit PriceUpdated(asset, uint256(price));
    }

    function getPrice(address asset) external view returns (uint256, uint256) {
        require(address(priceFeeds[asset]) != address(0), "Feed not found");
        require(lastPrices[asset] > 0, "Price not initialized");
        require(block.timestamp - lastUpdates[asset] <= heartbeats[asset], "Stale price");
        
        return (lastPrices[asset], lastUpdates[asset]);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}