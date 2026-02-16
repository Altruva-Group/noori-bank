import { ethers } from 'ethers';
import contractService from '../web3/contracts';

class BridgeService {
    async lockTokens(amount, targetChain, targetAddress) {
        try {
            const parsedAmount = ethers.utils.parseEther(amount.toString());
            const tx = await contractService.contracts.bridge.lockTokens(
                parsedAmount,
                targetChain,
                targetAddress
            );
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: receipt.transactionHash
            };
        } catch (error) {
            console.error('Error locking tokens:', error);
            throw error;
        }
    }

    async burnTokens(amount, targetChain, targetAddress) {
        try {
            const parsedAmount = ethers.utils.parseEther(amount.toString());
            const tx = await contractService.contracts.bridge.burnTokens(
                parsedAmount,
                targetChain,
                targetAddress
            );
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: receipt.transactionHash
            };
        } catch (error) {
            console.error('Error burning tokens:', error);
            throw error;
        }
    }

    async initiateTransfer(to, amount) {
        try {
            const parsedAmount = ethers.utils.parseEther(amount.toString());
            const tx = await contractService.contracts.bridge.initiateTransfer(
                to,
                parsedAmount
            );
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: receipt.transactionHash
            };
        } catch (error) {
            console.error('Error initiating transfer:', error);
            throw error;
        }
    }

    async sendTokens(targetChainId, targetAddress, amount, gasValue) {
        try {
            const parsedAmount = ethers.utils.parseEther(amount.toString());
            const tx = await contractService.contracts.bridge.sendTokens(
                targetChainId,
                targetAddress,
                parsedAmount,
                { value: ethers.utils.parseEther(gasValue.toString()) }
            );
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: receipt.transactionHash
            };
        } catch (error) {
            console.error('Error sending tokens:', error);
            throw error;
        }
    }

    // Admin Functions
    async registerChain(chainId, remoteBridge, enabled) {
        try {
            const tx = await contractService.contracts.bridge.registerChain(
                chainId,
                remoteBridge,
                enabled
            );
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: receipt.transactionHash
            };
        } catch (error) {
            console.error('Error registering chain:', error);
            throw error;
        }
    }

    async toggleChain(chainId, enabled) {
        try {
            const tx = await contractService.contracts.bridge.toggleChain(
                chainId,
                enabled
            );
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: receipt.transactionHash
            };
        } catch (error) {
            console.error('Error toggling chain:', error);
            throw error;
        }
    }

    async setBlockedAddress(account, blocked) {
        try {
            const tx = await contractService.contracts.bridge.setBlockedAddress(
                account,
                blocked
            );
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: receipt.transactionHash
            };
        } catch (error) {
            console.error('Error setting blocked address:', error);
            throw error;
        }
    }

    async setMinGasForTransfer(minGas) {
        try {
            const parsedGas = ethers.utils.parseEther(minGas.toString());
            const tx = await contractService.contracts.bridge.setMinGasForTransfer(parsedGas);
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: receipt.transactionHash
            };
        } catch (error) {
            console.error('Error setting min gas:', error);
            throw error;
        }
    }

    // Delayed Transfer Functions
    async executeDelayedTransfer(transferId) {
        try {
            const tx = await contractService.contracts.bridge.executeDelayedTransfer(transferId);
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: receipt.transactionHash
            };
        } catch (error) {
            console.error('Error executing delayed transfer:', error);
            throw error;
        }
    }

    async processDelayedTransfer(transferId) {
        try {
            const tx = await contractService.contracts.bridge.processDelayedTransfer(transferId);
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: receipt.transactionHash
            };
        } catch (error) {
            console.error('Error processing delayed transfer:', error);
            throw error;
        }
    }

    // Event Listeners
    async subscribeToBridgeEvents(callback) {
        try {
            const bridge = contractService.contracts.bridge;
            bridge.on('TokenLocked', (user, amount, targetChain, targetAddress) => {
                callback('TokenLocked', {
                    user,
                    amount: ethers.utils.formatEther(amount),
                    targetChain,
                    targetAddress
                });
            });

            bridge.on('TokenMinted', (user, amount, sourceChain, transactionHash) => {
                callback('TokenMinted', {
                    user,
                    amount: ethers.utils.formatEther(amount),
                    sourceChain,
                    transactionHash
                });
            });

            bridge.on('TransferDelayed', (transferId, recipient, amount) => {
                callback('TransferDelayed', {
                    transferId,
                    recipient,
                    amount: ethers.utils.formatEther(amount)
                });
            });
        } catch (error) {
            console.error('Error subscribing to bridge events:', error);
            throw error;
        }
    }
}

export const bridgeService = new BridgeService();
export default bridgeService;