import { ethers } from 'ethers';
import contractService from '../web3/contracts';

class TokenService {
    async transfer(to, amount) {
        try {
            const parsedAmount = ethers.utils.parseEther(amount.toString());
            const tx = await contractService.contracts.token.transfer(to, parsedAmount);
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: receipt.transactionHash
            };
        } catch (error) {
            console.error('Error transferring tokens:', error);
            throw error;
        }
    }

    async approve(spender, amount) {
        try {
            const parsedAmount = ethers.utils.parseEther(amount.toString());
            const tx = await contractService.contracts.token.approve(spender, parsedAmount);
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: receipt.transactionHash
            };
        } catch (error) {
            console.error('Error approving tokens:', error);
            throw error;
        }
    }

    async getAllowance(owner, spender) {
        try {
            const allowance = await contractService.contracts.token.allowance(owner, spender);
            return ethers.utils.formatEther(allowance);
        } catch (error) {
            console.error('Error getting allowance:', error);
            throw error;
        }
    }

    async getBalance(address) {
        try {
            const balance = await contractService.contracts.token.balanceOf(address);
            return ethers.utils.formatEther(balance);
        } catch (error) {
            console.error('Error getting balance:', error);
            throw error;
        }
    }

    async isFrozen(address) {
        try {
            return await contractService.contracts.token.isFrozen(address);
        } catch (error) {
            console.error('Error checking frozen status:', error);
            throw error;
        }
    }

    // Admin Functions
    async setMinter(address, status) {
        try {
            const tx = await contractService.contracts.token.setMinter(address, status);
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: receipt.transactionHash
            };
        } catch (error) {
            console.error('Error setting minter:', error);
            throw error;
        }
    }

    async setPauser(address, status) {
        try {
            const tx = await contractService.contracts.token.setPauser(address, status);
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: receipt.transactionHash
            };
        } catch (error) {
            console.error('Error setting pauser:', error);
            throw error;
        }
    }

    async blacklist(address) {
        try {
            const tx = await contractService.contracts.token.blacklist(address);
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: receipt.transactionHash
            };
        } catch (error) {
            console.error('Error blacklisting address:', error);
            throw error;
        }
    }

    async unblacklist(address) {
        try {
            const tx = await contractService.contracts.token.unblacklist(address);
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: receipt.transactionHash
            };
        } catch (error) {
            console.error('Error unblacklisting address:', error);
            throw error;
        }
    }

    async freeze(address) {
        try {
            const tx = await contractService.contracts.token.freezeAccount(address);
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: receipt.transactionHash
            };
        } catch (error) {
            console.error('Error freezing account:', error);
            throw error;
        }
    }

    async unfreeze(address) {
        try {
            const tx = await contractService.contracts.token.unfreezeAccount(address);
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: receipt.transactionHash
            };
        } catch (error) {
            console.error('Error unfreezing account:', error);
            throw error;
        }
    }

    // Emergency Functions
    async pause() {
        try {
            const tx = await contractService.contracts.token.pause();
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: receipt.transactionHash
            };
        } catch (error) {
            console.error('Error pausing contract:', error);
            throw error;
        }
    }

    async unpause() {
        try {
            const tx = await contractService.contracts.token.unpause();
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: receipt.transactionHash
            };
        } catch (error) {
            console.error('Error unpausing contract:', error);
            throw error;
        }
    }
}

export const tokenService = new TokenService();
export default tokenService;