import { ethers } from 'ethers';
import contractService from '../web3/contracts';

class VaultService {
    async register(masterPassword, recoveryKey) {
        try {
            const tx = await contractService.contracts.vault.register(masterPassword, recoveryKey);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'AccountRegistered');
            return {
                success: true,
                accountId: event.args.id.toString(),
                wallet: event.args.wallet
            };
        } catch (error) {
            console.error('Error registering account:', error);
            throw error;
        }
    }

    async generateMemo() {
        try {
            const tx = await contractService.contracts.vault.generateMemo();
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'MemoGenerated');
            return {
                success: true,
                memo: event.args.memo
            };
        } catch (error) {
            console.error('Error generating memo:', error);
            throw error;
        }
    }

    async deposit(amount) {
        try {
            const tx = await contractService.contracts.vault.deposit(
                ethers.utils.parseEther(amount.toString())
            );
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: receipt.transactionHash
            };
        } catch (error) {
            console.error('Error depositing:', error);
            throw error;
        }
    }

    async depositNative(amount) {
        try {
            const tx = await contractService.contracts.vault.depositNative({
                value: ethers.utils.parseEther(amount.toString())
            });
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: receipt.transactionHash
            };
        } catch (error) {
            console.error('Error depositing native token:', error);
            throw error;
        }
    }

    async withdraw(amount, token = null) {
        try {
            let tx;
            if (token) {
                tx = await contractService.contracts.vault.withdrawToken(
                    token,
                    ethers.utils.parseEther(amount.toString())
                );
            } else {
                tx = await contractService.contracts.vault.withdrawNative(
                    ethers.utils.parseEther(amount.toString())
                );
            }
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: receipt.transactionHash
            };
        } catch (error) {
            console.error('Error withdrawing:', error);
            throw error;
        }
    }

    async transfer(to, amount, memo, token = null) {
        try {
            let tx;
            if (token) {
                tx = await contractService.contracts.vault.transferToken(
                    token,
                    to,
                    ethers.utils.parseEther(amount.toString()),
                    memo
                );
            } else {
                tx = await contractService.contracts.vault.transferNative(
                    to,
                    ethers.utils.parseEther(amount.toString()),
                    memo
                );
            }
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: receipt.transactionHash
            };
        } catch (error) {
            console.error('Error transferring:', error);
            throw error;
        }
    }

    async getBalances(address, tokens) {
        try {
            const balances = await contractService.contracts.vault.getBalances(address, tokens);
            return balances.map(b => ethers.utils.formatEther(b));
        } catch (error) {
            console.error('Error getting balances:', error);
            throw error;
        }
    }

    async getFees() {
        try {
            const fees = await contractService.contracts.vault.getFees();
            return {
                transferFee: fees.transferFee.toString(),
                withdrawalFee: fees.withdrawalFee.toString()
            };
        } catch (error) {
            console.error('Error getting fees:', error);
            throw error;
        }
    }

    async getRates() {
        try {
            const rates = await contractService.contracts.vault.getRates();
            return {
                depositRate: rates.deposit.toString(),
                borrowRate: rates.borrow.toString(),
                minCollateralRatio: rates.collateral.toString()
            };
        } catch (error) {
            console.error('Error getting rates:', error);
            throw error;
        }
    }
}

export const vaultService = new VaultService();
export default vaultService;