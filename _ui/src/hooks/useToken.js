import { useState, useCallback, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import tokenService from '../services/token/tokenService';

export const useToken = () => {
    const { account } = useWeb3React();
    const [balance, setBalance] = useState('0');
    const [frozen, setFrozen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBalance = useCallback(async () => {
        if (!account) return;
        try {
            const balanceData = await tokenService.getBalance(account);
            setBalance(balanceData);
        } catch (err) {
            setError(err.message);
        }
    }, [account]);

    const checkFrozenStatus = useCallback(async () => {
        if (!account) return;
        try {
            const status = await tokenService.isFrozen(account);
            setFrozen(status);
        } catch (err) {
            setError(err.message);
        }
    }, [account]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchBalance(),
                    checkFrozenStatus()
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
    }, [account, fetchBalance, checkFrozenStatus]);

    const transfer = async (to, amount) => {
        try {
            const result = await tokenService.transfer(to, amount);
            await fetchBalance();
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const approve = async (spender, amount) => {
        try {
            return await tokenService.approve(spender, amount);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const getAllowance = async (owner, spender) => {
        try {
            return await tokenService.getAllowance(owner, spender);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Admin Functions
    const setMinter = async (address, status) => {
        try {
            return await tokenService.setMinter(address, status);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const setPauser = async (address, status) => {
        try {
            return await tokenService.setPauser(address, status);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const blacklist = async (address) => {
        try {
            return await tokenService.blacklist(address);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const unblacklist = async (address) => {
        try {
            return await tokenService.unblacklist(address);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const freeze = async (address) => {
        try {
            const result = await tokenService.freeze(address);
            if (address === account) {
                await checkFrozenStatus();
            }
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const unfreeze = async (address) => {
        try {
            const result = await tokenService.unfreeze(address);
            if (address === account) {
                await checkFrozenStatus();
            }
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const pause = async () => {
        try {
            return await tokenService.pause();
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const unpause = async () => {
        try {
            return await tokenService.unpause();
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    return {
        balance,
        frozen,
        loading,
        error,
        transfer,
        approve,
        getAllowance,
        setMinter,
        setPauser,
        blacklist,
        unblacklist,
        freeze,
        unfreeze,
        pause,
        unpause,
        refreshBalance: fetchBalance
    };
};