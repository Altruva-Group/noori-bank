import { useState, useCallback, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import vaultService from '../services/vault/vaultService';

export const useVault = () => {
    const { account } = useWeb3React();
    const [balances, setBalances] = useState({
        native: '0',
        tokens: {}
    });
    const [fees, setFees] = useState({
        transferFee: '0',
        withdrawalFee: '0'
    });
    const [rates, setRates] = useState({
        depositRate: '0',
        borrowRate: '0',
        minCollateralRatio: '0'
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBalances = useCallback(async (tokens = []) => {
        if (!account) return;
        try {
            const balanceData = await vaultService.getBalances(account, tokens);
            setBalances({
                native: balanceData[0],
                tokens: tokens.reduce((acc, token, index) => {
                    acc[token] = balanceData[index + 1];
                    return acc;
                }, {})
            });
        } catch (err) {
            setError(err.message);
        }
    }, [account]);

    const fetchFees = useCallback(async () => {
        try {
            const feeData = await vaultService.getFees();
            setFees(feeData);
        } catch (err) {
            setError(err.message);
        }
    }, []);

    const fetchRates = useCallback(async () => {
        try {
            const rateData = await vaultService.getRates();
            setRates(rateData);
        } catch (err) {
            setError(err.message);
        }
    }, []);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchBalances(),
                    fetchFees(),
                    fetchRates()
                ]);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (account) {
            loadData();
        }
    }, [account, fetchBalances, fetchFees, fetchRates]);

    const register = async (masterPassword, recoveryKey) => {
        try {
            return await vaultService.register(masterPassword, recoveryKey);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const generateMemo = async () => {
        try {
            return await vaultService.generateMemo();
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const deposit = async (amount) => {
        try {
            const result = await vaultService.deposit(amount);
            await fetchBalances();
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const depositNative = async (amount) => {
        try {
            const result = await vaultService.depositNative(amount);
            await fetchBalances();
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const withdraw = async (amount, token = null) => {
        try {
            const result = await vaultService.withdraw(amount, token);
            await fetchBalances();
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const transfer = async (to, amount, memo, token = null) => {
        try {
            const result = await vaultService.transfer(to, amount, memo, token);
            await fetchBalances();
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    return {
        balances,
        fees,
        rates,
        loading,
        error,
        register,
        generateMemo,
        deposit,
        depositNative,
        withdraw,
        transfer,
        refreshBalances: fetchBalances
    };
};