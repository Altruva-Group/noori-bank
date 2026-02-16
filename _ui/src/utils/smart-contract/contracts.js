// Utility functions to interact with smart contracts

// Helper to format amounts to Wei
export const toWei = (web3, amount) => {
    return web3.utils.toWei(amount.toString(), 'ether');
};

// Helper to format Wei to ETH/Tokens
export const fromWei = (web3, amount) => {
    if (!web3 || !web3.utils || !amount) return '0';
    return web3.utils.fromWei(amount.toString(), 'ether');
};

// Convert basis points (1/100 of a percent) to percentage
export const fromBasisPoints = (basisPoints) => {
    if (!basisPoints) return 0;
    return parseFloat(basisPoints) / 100;
};

// Convert percentage to basis points
export const toBasisPoints = (percentage) => {
    return Math.round(percentage * 100);
};

// Calculate daily compound interest
export const calculateDailyInterest = (principal, apr) => {
    const dailyRate = apr / 365 / 100;
    return principal * dailyRate;
};

// Calculate loan-to-value ratio
export const calculateLTV = (loanAmount, collateralValue) => {
    return (loanAmount / collateralValue) * 100;
};

// Get token balance for an address
export const getTokenBalance = async (tokenContract, address) => {
    try {
        const balance = await tokenContract.methods.balanceOf(address).call();
        return balance;
    } catch (error) {
        console.error('Error getting token balance:', error);
        throw error;
    }
};

// Get vault balance for an address
export const getVaultBalance = async (vaultContract, address) => {
    try {
        const balance = await vaultContract.methods.getBalance(address).call();
        return balance;
    } catch (error) {
        console.error('Error getting vault balance:', error);
        throw error;
    }
};

// Get user's collateral balance
export const getCollateralBalance = async (vaultContract, address) => {
    try {
        const collateral = await vaultContract.methods.getCollateral(address).call();
        return collateral;
    } catch (error) {
        console.error('Error getting collateral balance:', error);
        throw error;
    }
};

// Get user's loan balance
export const getLoanBalance = async (vaultContract, address) => {
    try {
        const loan = await vaultContract.methods.getLoan(address).call();
        return loan;
    } catch (error) {
        console.error('Error getting loan balance:', error);
        throw error;
    }
};

// Check if an account is registered
export const isRegistered = async (vaultContract, address) => {
    try {
        const result = await vaultContract.methods.isRegistered(address).call();
        return result;
    } catch (error) {
        console.error('Error checking registration:', error);
        throw error;
    }
};

// Get user's transaction history
export const getTransactionHistory = async (vaultContract, address) => {
    try {
        const events = await vaultContract.getPastEvents('allEvents', {
            filter: { user: address },
            fromBlock: 0,
            toBlock: 'latest'
        });
        return events;
    } catch (error) {
        console.error('Error getting transaction history:', error);
        throw error;
    }
};

// Deposit funds into vault
export const deposit = async (vaultContract, address, amount) => {
    try {
        const tx = await vaultContract.methods.deposit().send({
            from: address,
            value: amount
        });
        return tx;
    } catch (error) {
        console.error('Error depositing funds:', error);
        throw error;
    }
};

// Withdraw funds from vault
export const withdraw = async (vaultContract, address, amount) => {
    try {
        const tx = await vaultContract.methods.withdraw(amount).send({
            from: address
        });
        return tx;
    } catch (error) {
        console.error('Error withdrawing funds:', error);
        throw error;
    }
};

// Apply for a loan
export const applyForLoan = async (vaultContract, address, amount, collateral) => {
    try {
        const tx = await vaultContract.methods.borrow(amount).send({
            from: address,
            value: collateral
        });
        return tx;
    } catch (error) {
        console.error('Error applying for loan:', error);
        throw error;
    }
};

// Repay loan
export const repayLoan = async (vaultContract, address, amount) => {
    try {
        const tx = await vaultContract.methods.repay(amount).send({
            from: address
        });
        return tx;
    } catch (error) {
        console.error('Error repaying loan:', error);
        throw error;
    }
};

// Transfer funds between accounts
export const transfer = async (vaultContract, from, to, amount) => {
    try {
        const tx = await vaultContract.methods.transfer(to, amount).send({
            from
        });
        return tx;
    } catch (error) {
        console.error('Error transferring funds:', error);
        throw error;
    }
};

// Get system parameters (interest rates, fees, etc.)
export const getSystemParams = async (vaultContract) => {
    try {
        const [
            depositRate,
            borrowRate,
            transferFee,
            withdrawalFee,
            minCollateralRatio
        ] = await Promise.all([
            vaultContract.methods.depositRate().call(),
            vaultContract.methods.borrowRate().call(),
            vaultContract.methods.transferFee().call(),
            vaultContract.methods.withdrawalFee().call(),
            vaultContract.methods.minCollateralRatio().call()
        ]);

        return {
            depositRate,
            borrowRate,
            transferFee,
            withdrawalFee,
            minCollateralRatio
        };
    } catch (error) {
        console.error('Error getting system parameters:', error);
        throw error;
    }
};
