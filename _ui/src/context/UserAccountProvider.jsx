import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from 'prop-types';
import UserAccountContext from "./UserAccountContext";
import web3Service from '../utils/smart-contract/web3';
import { vaultContract, tokenContract } from "./../utils/smart-contract/blockchain";
import { fromBasisPoints } from '../utils/smart-contract/contracts';

// const NooriVaultABI = vaultJSON.abi;
// const NooriTokenABI = nooriTokenJSON.abi;

const UserAccountProvider = ({ children }) => {
    // State
    const [account, setAccount] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [chainId, setChainId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [tokenBalance, setTokenBalance] = useState('0');
    const [vaultBalance, setVaultBalance] = useState('0');
    const [systemParams, setSystemParams] = useState({
        depositRate: '0',
        borrowRate: '0',
        transferFee: '0',
        withdrawalFee: '0',
        minCollateralRatio: '0'
    });

    // // Contract addresses from environment
    // const tokenContractAddress = import.meta.env.VITE_TOKEN_CA;
    // const vaultContractAddress = import.meta.env.VITE_VAULT_CA;

    // Contract refs to avoid recreation
    const web3Ref = useRef(null);
    const tokenContractRef = useRef(null);
    const vaultContractRef = useRef(null);

    // Helper function to fetch balances
    const fetchBalances = useCallback(async () => {
        if (!tokenContractRef.current || !vaultContractRef.current || !account) return;

        try {
            const [tokenBal, vaultBal] = await Promise.all([
                tokenContractRef.current.methods.balanceOf(account).call(),
                vaultContractRef.current.methods.balanceOf(account).call()
            ]);

            setTokenBalance(tokenBal.toString());
            setVaultBalance(vaultBal.toString());
        } catch (err) {
            console.error('Error fetching balances:', err);
            setError('Failed to fetch balances');
        }
    }, [account]);

    // Helper function to fetch system parameters
    const fetchSystemParams = useCallback(async () => {
        if (!vaultContractRef.current || !account) return;

        try {
            const [depositRate, borrowRate, transferFee, withdrawalFee, minCollateralRatio] = 
                await Promise.all([
                    vaultContractRef.current.methods.getDepositRate().call(),
                    vaultContractRef.current.methods.getBorrowRate().call(),
                    vaultContractRef.current.methods.getTransferFee().call(),
                    vaultContractRef.current.methods.getWithdrawalFee().call(),
                    vaultContractRef.current.methods.getMinCollateralRatio().call()
                ]);

            // Convert from basis points to percentages
            setSystemParams({
                depositRate: fromBasisPoints(depositRate),
                borrowRate: fromBasisPoints(borrowRate),
                transferFee: fromBasisPoints(transferFee),
                withdrawalFee: fromBasisPoints(withdrawalFee),
                minCollateralRatio: fromBasisPoints(minCollateralRatio)
            });
        } catch (err) {
            console.error('Error fetching system parameters:', err);
            setError('Failed to fetch system parameters');
        }
    }, [account]);

    // Initialize contract instances
    const initializeContracts = useCallback(async () => {
        if (!web3Service.web3) {
            setError('Web3 not initialized');
            return;
        }

        // if (!tokenContractAddress || !vaultContractAddress) {
        //     setError('Contract addresses missing');
        //     return;
        // }

        try {
            web3Ref.current = web3Service.web3;

            tokenContractRef.current =  tokenContract;

            vaultContractRef.current = vaultContract;

            if (!tokenContractRef.current?.methods || !vaultContractRef.current?.methods) {
                throw new Error('Contract initialization failed');
            }

            if (account) {
                await fetchBalances();
                await fetchSystemParams();
            }
        } catch (err) {
            console.error('Contract initialization failed:', err);
            setError(err.message || 'Failed to initialize contracts');
            throw err;
        }
    }, [account, fetchBalances, fetchSystemParams]);

    // Handler for account changes
    const handleAccountsChanged = useCallback(async (accounts) => {
        if (accounts.length === 0) {
            web3Service.disconnect();
            setAccount(null);
            setIsConnected(false);
        } else {
            const newAccount = accounts[0];
            setAccount(newAccount);
            if (isConnected) {
                await initializeContracts();
            }
        }
    }, [isConnected, initializeContracts]);

    // Handler for network changes
    const handleChainChanged = useCallback(async (newChainId) => {
        setChainId(newChainId);
        if (isConnected) {
            try {
                await initializeContracts();
            } catch (err) {
                console.error('Failed to reinitialize contracts:', err);
                setError('Network changed - please reconnect your wallet');
                web3Service.disconnect();
                setIsConnected(false);
                setAccount(null);
            }
        }
    }, [isConnected, initializeContracts]);

    // Connect wallet function
    const connectWallet = async () => {
        try {
            setLoading(true);
            setError(null);

            // This will trigger the wallet popup
            const { account: connectedAccount, chainId: connectedChainId } = await web3Service.connect();

            // Update state with connection info
            setAccount(connectedAccount);
            setChainId(connectedChainId);
            setIsConnected(true);

            // Now initialize contracts
            await initializeContracts();
        } catch (err) {
            console.error('Wallet connection failed:', err);
            setError(err.message || 'Failed to connect wallet');
            await web3Service.disconnect();
            setAccount(null);
            setChainId(null);
            setIsConnected(false);
        } finally {
            setLoading(false);
        }
    };

    // Disconnect wallet function
    const disconnectWallet = useCallback(() => {
        web3Service.disconnect();
        setAccount(null);
        setIsConnected(false);
        setTokenBalance('0');
        setVaultBalance('0');
        tokenContractRef.current = null;
        vaultContractRef.current = null;
        setError(null);
    }, []);

    // Effect to update balances when account changes
    useEffect(() => {
        if (account && isConnected) {
            fetchBalances();
            fetchSystemParams();
        }
    }, [account, isConnected, fetchBalances, fetchSystemParams]);

    const contextValue = {
        account,
        isConnected,
        chainId,
        loading,
        error,
        tokenBalance,
        vaultBalance,
        systemParams,
        contracts: {
            token: tokenContractRef.current,
            vault: vaultContractRef.current
        },
        connectWallet,
        disconnectWallet,
        web3: web3Service.web3
    };

    return (
        <UserAccountContext.Provider value={contextValue}>
            {children}
        </UserAccountContext.Provider>
    );
};

UserAccountProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export default UserAccountProvider;