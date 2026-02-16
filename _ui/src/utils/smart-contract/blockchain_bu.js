import web3Service from './web3_bu';
import nooriTokenJSON from "./abis/NooriToken.json";
import vaultJSON from "./abis/NooriVault.json";
import bridgeJSON from "./abis/NooriBankBridge.json";

const vaultCA = import.meta.env.VITE_VAULT_CA;
const nooriTokenCA = import.meta.env.VITE_TOKEN_CA;
const bridgeCA = import.meta.env.VITE_BRIDGE_CA;

export const adminAccount = import.meta.env.VITE_ACCOUNT;

let vaultContract;
let nooriTokenContract;
let bridgeContract;

// Initialize contracts
const initializeContracts = async () => {
    if (!web3Service.web3) {
        throw new Error("Web3 service not initialized!");
    }
    
    if (!vaultContract) {
        vaultContract = web3Service.createContract(vaultJSON.abi, vaultCA);
    }

    if (!nooriTokenContract) {
        nooriTokenContract = web3Service.createContract(nooriTokenJSON.abi, nooriTokenCA);
    }
    
    if (!bridgeContract) {
        bridgeContract = web3Service.createContract(bridgeJSON.abi, bridgeCA);
    }
    
    return { vaultContract, nooriTokenContract, bridgeContract };
};

// Helper to ensure contracts are initialized
const ensureContracts = async () => {
    if (!vaultContract || !nooriTokenContract || !bridgeContract) {
        await initializeContracts();
    }
    return { vaultContract, nooriTokenContract, bridgeContract };
};

// ===================== //
//         VAULT         //
// ===================== //

// ===== GENERAL ===== //
// register
export const vaultRegister = async (masterPassword, recoveryKey) => {
    try {
        await ensureContracts();
        const account = web3Service.account;
        if (!account) throw new Error("No wallet connected");
           
        const gasEstimate = await vaultContract.methods.register(
            masterPassword,
            recoveryKey
        ).estimateGas({
            from: account
        });

        const newUser = await vaultContract.methods.register(
            masterPassword,
            recoveryKey
        ).send({
            from: account,
            gas: Math.floor(gasEstimate * 1.1) // Add 10% buffer
        });

        return newUser;
    } catch (error) {
        console.error("Error in vaultRegister:", error);
        throw error;
    }
}

// generate memo 
export const vaultGenerateMemo = async () => {
    try {
        const account = web3Service.account;
        if (!account) throw new Error("No wallet connected");
           
        const gasEstimate = await vaultContract.methods.generateMemo().estimateGas({
            from: account
        });

        const newMemo = await vaultContract.methods.generateMemo().send({
            from: account,
            gas: gasEstimate
        });

        return newMemo;
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to generate new memo."
        }
    }
}

// get account details
export const vaultAccountDetails = async (accountId) => {
    try {
        const account = await getCurrentWalletConnected();
        
        const accountDetails = await vaultContract.getAccountDetails(accountId).call({
            from: account
        });

        return accountDetails;
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to get account details."
        }
    }
}

// get ERC20Balance
export const vaultERC20Balance = async (accountId, tokenAddress) => {
    try {
        const account = await getCurrentWalletConnected();
        
        const token = await vaultContract.methods.getERC20Balance(accountId, tokenAddress).call({
            from: account
        });

        return token;
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to get token details."
        }
    }
} 

// get transaction history
export const vaultGetTxHistory = async (accountId) => { // accountId not used in this version
    try {
        const account = await getCurrentWalletConnected();

        const txHistory = await vaultContract.methods.getTransactionHistory(accountId).call({from: account});
    
        return txHistory;
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to get transaction records."
        }
    }
    
}

// verify KYC
export const vaultVerifyKYC = async () => {
    try {
        const account = getCurrentWalletConnected();

        const gasEstimate = await vaultContract.methods.verifyKYC().estimateGas({
            from: account
        });
        
        await vaultContract.methods.verifyKYC().send({
            from: account,
            gas: gasEstimate
        });

        return {
            success: true,
            message: "Account KYC successful."
        }
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to verify KYC details."
        }
    }
}

// get Latest Asset Price
export const vaultGetAssetPrice = async (token) => {
    try {
        const account = await getCurrentWalletConnected();
        
        const price = await vaultContract.methods.getLatestAssetPrice(token).call({
            from: account
        });

        return price;
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to get asset price."
        }
    }
}

// calculate Asset Value
export const vaultCalculateAssetValue = async (token, amount) => {
    try {
        // const account = await getCurrentWalletConnected();
        
        const value = await vaultContract.methods.calculateAssetValue(token, amount).call(); 

        return value;
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to get asset price."
        }
    }
}

// calculate Account Total Worth
export const vaultCalculateAccountWorth = async (accountId) => {
    try {
        const account = await getCurrentWalletConnected();
        
        const worth = await vaultContract.methods.calculateAccountAssetsValue(accountId).call({
            from: account
        });

        return worth;
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to get account value worth."
        }
    }
}

// get Transfer Fee
export const vaultGetTransferFee = async (amount) => { 
    try {
        // const account = await getCurrentWalletConnected();
        
        const fee = await vaultContract.methods.getTransferFee(amount).call();

        return fee;
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to get transfer fee."
        }
    }
}

// get Withdrawal Fee
export const vaultGetWithdrawalFee = async (amount) => { 
    try {
        // const account = await getCurrentWalletConnected();
        
        const fee = await vaultContract.methods.getWithdrawalFee(amount).call();

        return fee;
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to get withdrawal fee."
        }
    }
}

// recover Account
export const vaultRecoverAccount = async (recoveryKey, newMasterPassword) => {
    try {
        const account = await getCurrentWalletConnected();
        
        const gasEstimate = await vaultContract.methods.recoverAccount(account, recoveryKey, newMasterPassword).estimateGas({
            from: account
        });
        
        await vaultContract.methods.recoverAccount(account, recoveryKey, newMasterPassword).send({
            from: account,
            gas: gasEstimate
        });

        return {
            success: true,
            message: "New account Master Password generated."
        }
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to set new Master Password for account."
        }
    }
}


// ===== DEPOSIT ===== //
// deposit ETH
export const vaultDepositETH = async (amount) => {
    try {
        const account = await getCurrentWalletConnected();
        
        const gasEstimate = await vaultContract.methods.deposit().estimateGas({
            from: account,
            value: amount
        });
        
        await vaultContract.methods.deposit().send({
            from: account,
            value: amount,
            gas: gasEstimate
        })

        return {
            success: true,
            message: `${amount} ETH deposited to your Noori Bank account!`
        }
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to deposit ETH."
        }
    }
}

// deposit ERC20
export const vaultDepositERC20 = async (tokenName, tokenAddress, amount) => {
    try {
        const account = await getCurrentWalletConnected();
        
        const gasEstimate = await vaultContract.methods.depositERC20(tokenAddress, amount).estimateGas({
            from: account
        });
        
        await vaultContract.methods.depositERC20(tokenAddress, amount).send({
            from: account,
            gas: gasEstimate
        });

        return {
            success: true,
            message: `${tokenName} successfully deposited to your Noori Bank Account!`
        }
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: `Failed to deposit ${tokenName} tokens.`
        }
    }
}

// deposit Noori Bank Token
export const vaultDepositNativeToken = async (amount) => {
    try {
        const account = await getCurrentWalletConnected();
        
        const gasEstimate = await vaultContract.methods.depositNativeToken(amount).estimateGas({
            from: account
        })

        await vaultContract.methods.depositNativeToken(amount).send({
            from: account,
            gas: gasEstimate
        })

        return {
            success: true,
            message: `${amount} Noori Tokens deposited to your Noori Bank Account!`
        }
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to deposit Noori Tokens."
        }
    }
}


// ===== TRANSFER ===== //
// transfer ETH
export const vaultTransferETH = async (amount, masterPassword, to=null, memo=null) => {
    try {
        if(!to && !memo) throw new Error("Receiver address (Wallet or Memo) is required!");

        const account = await getCurrentWalletConnected();
        
        const gasEstimate = await vaultContract.methods.transfer(to, amount, masterPassword, memo).estimateGas({
            from: account,
            value: amount
        })

        await vaultContract.methods.transfer(to, amount, masterPassword, memo).send({
            from: account,
            value: amount,
            gas: gasEstimate
        })

        return {
            success: true,
            message: `${amount} ETH transferred to ${to ? to : memo}`
        }
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to send ETH."
        }
    }
}

// deposit ERC20
export const vaultTransferERC20 = async (tokenName, tokenAddress, amount, masterPassword, to=null, memo=null) => {
    try {
        if(!to && !memo) throw new Error("Receiver address (Wallet or Memo) is required!");

        const account = await getCurrentWalletConnected();
        
        const gasEstimate = await vaultContract.methods.transferERC20(tokenAddress, to, amount, masterPassword, memo).estimateGas({
            from: account
        });

        await vaultContract.methods.transferERC20(tokenAddress, to, amount, masterPassword, memo).send({
            from: account,
            gas: gasEstimate
        });

        return {
            success: true,
            message: `${tokenName} successfully transferred to ${to ? to : memo}!`
        }
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: `Failed to transfer ${tokenName} tokens.`
        }
    }
}

// deposit Noori Bank Token
export const vaultTransferNativeToken = async (to=null, amount, masterPassword, memo=null) => {
    try {
        if(!to && !memo) throw new Error("Receiver address (Wallet or Memo) is required!");

        const account = await getCurrentWalletConnected();
        
        const gasEstimate = await vaultContract.methods.transferNativeToken(to, amount, masterPassword, memo).estimateGas({
            from: account
        })

        await vaultContract.methods.transferNativeToken(to, amount, masterPassword, memo).send({
            from: account,
            gas: gasEstimate
        })

        return {
            success: true,
            message: `${amount} Noori Tokens transferred to ${to ? to : memo}!`
        }
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to transfer Noori Tokens."
        }
    }
}

// ===== WITHDRAW ===== //
// withdraw ETH
export const vaultWithdrawETH = async (amount, masterPassword) => {
    try {
        const account = await getCurrentWalletConnected();
        
        const gasEstimate = await vaultContract.methods.withdraw(masterPassword).estimateGas({
            from: account,
            value: amount
        })

        await vaultContract.methods.withdraw(masterPassword).send({
            from: account,
            value: amount,
            gas: gasEstimate
        })

        return {
            success: true,
            message: `${amount} ETH withdrawn from your Noori Bank account!`
        }
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to withdraw ETH."
        }
    }
}

// withdraw ERC20
export const vaultWithdrawERC20 = async (tokenName, tokenAddress, amount, masterPassword) => {
    try {
        const account = await getCurrentWalletConnected();
        
        const gasEstimate = await vaultContract.methods.withdrawERC20(tokenAddress, amount, masterPassword).estimateGas({
            from: account
        });

        await vaultContract.methods.withdrawERC20(tokenAddress, amount, masterPassword).send({
            from: account,
            gas: gasEstimate
        });

        return {
            success: true,
            message: `${tokenName} successfully withdrawn from your Noori Bank Account!`
        }
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: `Failed to withdraw ${tokenName} tokens.`
        }
    }
}

// deposit Noori Bank Token
export const vaultWithdrawNativeToken = async (amount, masterPassword) => {
    try {
        const account = await getCurrentWalletConnected();
        
        const gasEstimate = await vaultContract.methods.withdrawNativeToken(amount, masterPassword).estimateGas({
            from: account
        });

        await vaultContract.methods.withdrawNativeToken(amount, masterPassword).send({
            from: account,
            gas: gasEstimate
        });

        return {
            success: true,
            message: `${amount} Noori Tokens withdrawn from your Noori Bank Account!`
        }
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to withdraw Noori Tokens."
        }
    }
}


// ===== ADMIN ===== //

// set price feed
export const vaultSetPriceFeedAdmin = async (priceFeed) => {
    try {
        const account = await getCurrentWalletConnected();
        
        const gasEstimate = await vaultContract.methods.setPriceFeed(priceFeed).estimateGas({
            from: account
        });
        
        await vaultContract.methods.setPriceFeed(priceFeed).send({
            from: account,
            gas: gasEstimate
        });

        return {
            success: true,
            message: "New price feed successfully set",
        }
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to set new price feed."
        }
    }
}

// set KYC service 
export const vaultSetKYCAdmin = async (kycService) => {
    try {
        const account = await getCurrentWalletConnected();
        
        const gasEstimate = await vaultContract.methods.setKYCService(kycService).estimateGas({
            from: account
        });

        await vaultContract.methods.setKYCService(kycService).send({
            from: account,
            gas: gasEstimate
        });

        return {
            success: true,
            message: "New KYC Service set",
        }
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to set new KYC Service."
        }
    }
}

// set savings interest rate
export const vaultSetSavingsInterestRate = async (rate) => {
    try {
        const account = await getCurrentWalletConnected();
        
        const gasEstimate = await vaultContract.methods.setSavingInterestRate(rate).estimateGas({
            from: account
        })

        await vaultContract.methods.setSavingInterestRate(rate).send({
            from: account,
            gas: gasEstimate
        })

        return {
            success: true,
            message: "New Savings Interest rate set."
        }
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to set new interest rate for savings."
        }
    }
}

// set native token 
// this function is not added, 
// as I don't plan to change the native token 
// at least not at this time

// get all transactions history
export const vaultGetAllTxHistory = async () => {
    try {
        const account = await getCurrentWalletConnected();
        
        const txHistory = await vaultContract.methods.getAllTransactionHistory().call({
            from: account
        });

        return txHistory;
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to get all transaction history."
        }
    }
}

// get specific user transactions history
export const vaultGetUserTxHistory = async (wallet) => {
    try {
        const account = await getCurrentWalletConnected();
        
        const txHistory = await vaultContract.methods.getUserTransactionHistory(wallet).call({
            from: account
        });

        return txHistory;
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to get all transaction history."
        }
    }
}

// set fees 
export const vaultSetFees = async (transferFee, maxTransferFee, withDrawalFee, maxWithdrawalFee) => {
    try {
        const account = await getCurrentWalletConnected();
        
        const gasEstimate = await vaultContract.methods.setFees(transferFee, maxTransferFee, withDrawalFee, maxWithdrawalFee).estimateGas({
            from: account
        });

        await vaultContract.methods.setFees(transferFee, maxTransferFee, withDrawalFee, maxWithdrawalFee).send({
            from: account,
            gas: gasEstimate
        });

        return {
            success: true,
            message: "New fees have been set for the bank!"
        }
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to set new fees."
        }
    }
}

// get native token pool balance
export const vaultGetNativeTokenPoolBalance = async () => {
    try {
        const account = await getCurrentWalletConnected();
        
        const poolBalance = await vaultContract.methods.getNativeTokenPoolBalance().call({
            from: account
        });

        return poolBalance;
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to get pool balance."
        }
    }
}


// ===================== //
//         TOKEN         //
// ===================== //

// ===== USER ===== //


// ===== ADMIN ===== //

export const tokenMintAdmin = async (to, amount) => {
    try {
        const account = await getCurrentWalletConnected();
        
        const gasEstimate = await nooriTokenContract.methods.mint(to, amount).estimateGas({
            from: account
        });

        await nooriTokenContract.methods.mint(to, amount).send({
            from: account,
            gas: gasEstimate
        });

        return {
            success: true,
            message: `${amount} Noori Tokens minted to ${to}`
        }
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: `Failed to mint Noori Tokens ${to}`
        }
    }
}

export const tokenPauseAdmin = async () => {
    try {
        const account = await getCurrentWalletConnected();
        
        const gasEstimate = await nooriTokenContract.methods.pause().estimateGas({
            from: account
        });
        
        await nooriTokenContract.methods.pause().send({
            from: account,
            gas: gasEstimate
        });

        return {
            success: true,
            message: "Fiat token paused!"
        }
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: `Failed to pause Noori Tokens`
        } 
    }
}

export const tokenUnpauseAdmin = async () => {
    try {
        const account = await getCurrentWalletConnected();
        
        const gasEstimate = await nooriTokenContract.methods.unpause().estimateGas({
            from: account
        });
        
        await nooriTokenContract.methods.unpause().send({
            from: account,
            gas: gasEstimate
        });

        return {
            success: true,
            message: "Fiat token unpaused!"
        }
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: `Failed to unpause Noori Tokens`
        } 
    }
}

export const tokenFreeAccountAdmin = async (userAccount) => {
    try {
        const account = await getCurrentWalletConnected();
        
        const gasEstimate = await nooriTokenContract.methods.freezeAccount(userAccount).estimateGas({
            from: account,
        });

        await nooriTokenContract.methods.freezeAccount(userAccount).send({
            from: account,
            gas: gasEstimate
        });

        return {
            success: true,
            message: `Account ${account} has been blacklisted`
        }
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to freeze account."
        }
    }
}

export const tokenUnfreeAccountAdmin = async (userAccount) => {
    try {
        const account = await getCurrentWalletConnected();
        
        const gasEstimate = await nooriTokenContract.methods.unfreezeAccount(userAccount).estimateGas({
            from: account,
        });

        await nooriTokenContract.methods.unfreezeAccount(userAccount).send({
            from: account,
            gas: gasEstimate
        });

        return {
            success: true,
            message: `Account ${account} has been blacklisted`
        }
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to freeze account."
        }
    }
}

export const tokenSetMinterAdmin = async (minter, status) => {
    try {
        const account = await getCurrentWalletConnected();
        
        const gasEstimate = await nooriTokenContract.methods.setMinter(minter, status).estimateGas({
            from: account
        });

        await nooriTokenContract.methods.setMinter(minter, status).send({
            from: account,
            gas: gasEstimate
        });

        return {
            success: true,
            message: `${status ? `${minter} has been been added to Minter accounts` : `${minter} has been removed from minter accounts`}`
        }
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to set Minter account"
        }
    }
}

export const tokenSetPauserAdmin = async (pauser, status) => {
    try {
        const account = await getCurrentWalletConnected();
        
        const gasEstimate = await nooriTokenContract.methods.setPauser(pauser, status).estimateGas({
            from: account
        });

        await nooriTokenContract.methods.setPauser(pauser, status).send({
            from: account,
            gas: gasEstimate
        });

        return {
            success: true,
            message: `${status ? `${pauser} has been added to Pauser accounts` : `${pauser} has been removed from Pauser accounts`}`
        }
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to set Pauser account"
        }
    }
}

export const tokenSetBridge = async (bridge, status) => {
    try {
        const account = await getCurrentWalletConnected();
        
        const gasEstimate = await nooriTokenContract.methods.setBridge(bridge, status).estimateGas({
            from: account
        });

        await nooriTokenContract.methods.setBridge(bridge, status).send({
            from: account,
            gas: gasEstimate
        });

        return {
            success: true,
            message: `${status ? `${bridge} has been added to allowed Bridge addresses` : `${bridge} has been removed from allowed Bridge addresses`}`
        }
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to set bridge for token"
        }
    }
}











// export const tokenGetTotalSupply = async (account, ) => {
//     const totalSupply = await nooriTokenContract.methods.totalSupply().call();
//     // console.log({totalSupply});
//     return totalSupply; 
// };
// // getTotalSupply().then(console.log);

// export const tokenBalanceOf = async (account, account) => {   
//     const balance = await nooriTokenContract.methods.balanceOf(account).call();
//     return balance;
// }
// // balanceOf(account).then(console.log);
// // balanceOf(recipient).then(console.log);

// export const tokenTransfer = async (account, to, amount) => {
//     const gasEstimate = await nooriTokenContract.methods.transfer(to, amount).estimateGas({from: account});
    
//     const response = await nooriTokenContract.methods.transfer(to, amount).send({
//         from: account,
//         gas: gasEstimate
//     });

//     return response;
// }



// // console.log({vaultContract})