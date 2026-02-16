// monitoring/eventMonitor.js
const { ethers } = require('ethers');
const { createLogger, format, transports } = require('winston');

class EventMonitor {
    constructor(config) {
        this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
        this.contracts = {
            token: new ethers.Contract(config.tokenAddress, config.tokenAbi, this.provider),
            vault: new ethers.Contract(config.vaultAddress, config.vaultAbi, this.provider),
            bridge: new ethers.Contract(config.bridgeAddress, config.bridgeAbi, this.provider),
            kyc: new ethers.Contract(config.kycAddress, config.kycAbi, this.provider),
            oracle: new ethers.Contract(config.oracleAddress, config.oracleAbi, this.provider)
        };

        this.logger = createLogger({
            level: 'info',
            format: format.combine(
                format.timestamp(),
                format.json()
            ),
            transports: [
                new transports.File({ filename: 'error.log', level: 'error' }),
                new transports.File({ filename: 'combined.log' })
            ]
        });

        if (process.env.NODE_ENV !== 'production') {
            this.logger.add(new transports.Console({
                format: format.simple()
            }));
        }

        this.alertThresholds = {
            largeTransfer: ethers.utils.parseEther('10000'),
            lowLiquidityRatio: 0.2,
            highUtilizationRate: 0.8,
            crossChainDelay: 3600 // 1 hour
        };
    }

    async start() {
        // Monitor vault events
        this.contracts.vault.on('Deposit', this.handleDeposit.bind(this));
        this.contracts.vault.on('Withdraw', this.handleWithdraw.bind(this));
        this.contracts.vault.on('InterestAccrued', this.handleInterest.bind(this));
        this.contracts.vault.on('CollateralLiquidated', this.handleLiquidation.bind(this));

        // Monitor bridge events
        this.contracts.bridge.on('TokenLocked', this.handleBridgeLock.bind(this));
        this.contracts.bridge.on('TokenMinted', this.handleBridgeMint.bind(this));
        this.contracts.bridge.on('TransferDelayed', this.handleDelayedTransfer.bind(this));

        // Monitor system events
        this.contracts.vault.on('EmergencyPause', this.handleEmergency.bind(this));
        this.contracts.token.on('RoleGranted', this.handleRoleChange.bind(this));
        
        // Start periodic checks
        this.startPeriodicChecks();
    }

    async handleDeposit(user, amount, timestamp) {
        this.logger.info('Deposit Event', {
            user,
            amount: ethers.utils.formatEther(amount),
            timestamp: new Date(timestamp * 1000).toISOString()
        });

        if (amount.gte(this.alertThresholds.largeTransfer)) {
            this.alertLargeTransfer('deposit', user, amount);
        }
    }

    async handleWithdraw(user, amount, timestamp) {
        this.logger.info('Withdraw Event', {
            user,
            amount: ethers.utils.formatEther(amount),
            timestamp: new Date(timestamp * 1000).toISOString()
        });

        if (amount.gte(this.alertThresholds.largeTransfer)) {
            this.alertLargeTransfer('withdraw', user, amount);
        }
    }

    async handleInterest(totalAccrued, timestamp) {
        this.logger.info('Interest Accrual', {
            amount: ethers.utils.formatEther(totalAccrued),
            timestamp: new Date(timestamp * 1000).toISOString()
        });

        // Monitor interest rate trends
        await this.checkInterestTrends(totalAccrued);
    }

    async handleLiquidation(user, collateral, debt, timestamp) {
        this.logger.warn('Liquidation Event', {
            user,
            collateral: ethers.utils.formatEther(collateral),
            debt: ethers.utils.formatEther(debt),
            timestamp: new Date(timestamp * 1000).toISOString()
        });

        // Alert on large liquidations
        if (collateral.gte(this.alertThresholds.largeTransfer)) {
            this.alertLargeLiquidation(user, collateral, debt);
        }
    }

    async handleBridgeLock(user, amount, targetChain, timestamp) {
        this.logger.info('Bridge Lock Event', {
            user,
            amount: ethers.utils.formatEther(amount),
            targetChain,
            timestamp: new Date(timestamp * 1000).toISOString()
        });

        // Track pending cross-chain transfers
        this.trackCrossChainTransfer(user, amount, targetChain, timestamp);
    }

    async handleBridgeMint(user, amount, sourceChain, txHash, timestamp) {
        this.logger.info('Bridge Mint Event', {
            user,
            amount: ethers.utils.formatEther(amount),
            sourceChain,
            txHash,
            timestamp: new Date(timestamp * 1000).toISOString()
        });

        // Complete cross-chain transfer tracking
        this.completeCrossChainTransfer(txHash, timestamp);
    }

    async handleDelayedTransfer(transferId, recipient, amount, timestamp) {
        this.logger.info('Delayed Transfer Event', {
            transferId,
            recipient,
            amount: ethers.utils.formatEther(amount),
            timestamp: new Date(timestamp * 1000).toISOString()
        });

        // Monitor delayed transfer status
        this.monitorDelayedTransfer(transferId, timestamp);
    }

    async handleEmergency(paused, reason, timestamp) {
        this.logger.error('Emergency Event', {
            paused,
            reason,
            timestamp: new Date(timestamp * 1000).toISOString()
        });

        // Alert all stakeholders
        this.alertEmergency(paused, reason);
    }

    async handleRoleChange(role, account, sender, timestamp) {
        this.logger.warn('Role Change Event', {
            role: ethers.utils.keccak256(role),
            account,
            sender,
            timestamp: new Date(timestamp * 1000).toISOString()
        });

        // Alert on admin role changes
        if (role === ethers.utils.keccak256('ADMIN_ROLE')) {
            this.alertAdminChange(account, sender);
        }
    }

    async startPeriodicChecks() {
        // Check system health every 5 minutes
        setInterval(async () => {
            await this.checkSystemHealth();
        }, 5 * 60 * 1000);

        // Check pending transfers every minute
        setInterval(async () => {
            await this.checkPendingTransfers();
        }, 60 * 1000);

        // Monitor price feeds every 30 seconds
        setInterval(async () => {
            await this.monitorPriceFeeds();
        }, 30 * 1000);
    }

    async checkSystemHealth() {
        try {
            // Check liquidity ratio
            const totalAssets = await this.contracts.vault.totalAssets();
            const totalBorrows = await this.contracts.vault.totalBorrows();
            const liquidityRatio = totalAssets.sub(totalBorrows).div(totalAssets);

            if (liquidityRatio.lt(this.alertThresholds.lowLiquidityRatio)) {
                this.alertLowLiquidity(liquidityRatio);
            }

            // Check utilization rate
            const utilizationRate = totalBorrows.div(totalAssets);
            if (utilizationRate.gt(this.alertThresholds.highUtilizationRate)) {
                this.alertHighUtilization(utilizationRate);
            }

            this.logger.info('System Health Check', {
                totalAssets: ethers.utils.formatEther(totalAssets),
                totalBorrows: ethers.utils.formatEther(totalBorrows),
                liquidityRatio: liquidityRatio.toString(),
                utilizationRate: utilizationRate.toString()
            });
        } catch (error) {
            this.logger.error('System Health Check Failed', { error: error.message });
        }
    }

    async checkPendingTransfers() {
        try {
            // Get all pending transfers
            const pendingTransfers = await this.contracts.bridge.getPendingTransfers();
            
            for (const transfer of pendingTransfers) {
                const delay = Date.now() / 1000 - transfer.timestamp.toNumber();
                
                if (delay > this.alertThresholds.crossChainDelay) {
                    this.alertDelayedTransfer(transfer);
                }
            }
        } catch (error) {
            this.logger.error('Pending Transfers Check Failed', { error: error.message });
        }
    }

    async monitorPriceFeeds() {
        try {
            // Get all supported assets
            const assets = await this.contracts.oracle.getSupportedAssets();
            
            for (const asset of assets) {
                const [price, timestamp] = await this.contracts.oracle.getPrice(asset);
                const heartbeat = await this.contracts.oracle.heartbeats(asset);
                
                if (Date.now() / 1000 - timestamp.toNumber() > heartbeat.toNumber()) {
                    this.alertStalePriceFeed(asset, timestamp);
                }
            }
        } catch (error) {
            this.logger.error('Price Feed Monitor Failed', { error: error.message });
        }
    }

    // Alert methods
    alertLargeTransfer(type, user, amount) {
        this.logger.warn('Large Transfer Alert', {
            type,
            user,
            amount: ethers.utils.formatEther(amount)
        });
        // Send alerts to admin dashboard, email, etc.
    }

    alertLargeLiquidation(user, collateral, debt) {
        this.logger.warn('Large Liquidation Alert', {
            user,
            collateral: ethers.utils.formatEther(collateral),
            debt: ethers.utils.formatEther(debt)
        });
        // Send alerts
    }

    alertLowLiquidity(ratio) {
        this.logger.warn('Low Liquidity Alert', {
            ratio: ratio.toString()
        });
        // Send alerts
    }

    alertHighUtilization(rate) {
        this.logger.warn('High Utilization Alert', {
            rate: rate.toString()
        });
        // Send alerts
    }

    alertDelayedTransfer(transfer) {
        this.logger.warn('Delayed Transfer Alert', {
            transferId: transfer.id,
            delay: Date.now() / 1000 - transfer.timestamp.toNumber()
        });
        // Send alerts
    }

    alertStalePriceFeed(asset, lastUpdate) {
        this.logger.warn('Stale Price Feed Alert', {
            asset,
            lastUpdate: new Date(lastUpdate * 1000).toISOString()
        });
        // Send alerts
    }

    alertEmergency(paused, reason) {
        this.logger.error('Emergency Alert', {
            paused,
            reason
        });
        // Send high-priority alerts
    }

    alertAdminChange(account, sender) {
        this.logger.warn('Admin Change Alert', {
            account,
            sender
        });
        // Send alerts
    }
}

module.exports = EventMonitor;