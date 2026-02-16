import { useState, useEffect, useCallback } from 'react';
import { useWeb3React } from '@web3-react/core';
import bridgeService from '../services/bridge/bridgeService';

export const useBridge = () => {
    const { account } = useWeb3React();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [bridgeEvents, setBridgeEvents] = useState([]);

    useEffect(() => {
        if (!account) return;

        const handleBridgeEvent = (eventType, eventData) => {
            setBridgeEvents(prev => [...prev, { type: eventType, ...eventData, timestamp: Date.now() }]);
        };

        const subscribeToBridge = async () => {
            try {
                await bridgeService.subscribeToBridgeEvents(handleBridgeEvent);
            } catch (err) {
                setError(err.message);
            }
        };

        subscribeToBridge();
    }, [account]);

    const lockTokens = async (amount, targetChain, targetAddress) => {
        setLoading(true);
        try {
            return await bridgeService.lockTokens(amount, targetChain, targetAddress);
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const burnTokens = async (amount, targetChain, targetAddress) => {
        setLoading(true);
        try {
            return await bridgeService.burnTokens(amount, targetChain, targetAddress);
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const sendTokens = async (targetChainId, targetAddress, amount, gasValue) => {
        setLoading(true);
        try {
            return await bridgeService.sendTokens(targetChainId, targetAddress, amount, gasValue);
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const executeDelayedTransfer = async (transferId) => {
        setLoading(true);
        try {
            return await bridgeService.executeDelayedTransfer(transferId);
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Admin Functions
    const registerChain = async (chainId, remoteBridge, enabled) => {
        setLoading(true);
        try {
            return await bridgeService.registerChain(chainId, remoteBridge, enabled);
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const toggleChain = async (chainId, enabled) => {
        setLoading(true);
        try {
            return await bridgeService.toggleChain(chainId, enabled);
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const setBlockedAddress = async (account, blocked) => {
        setLoading(true);
        try {
            return await bridgeService.setBlockedAddress(account, blocked);
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const setMinGasForTransfer = async (minGas) => {
        setLoading(true);
        try {
            return await bridgeService.setMinGasForTransfer(minGas);
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const clearEvents = useCallback(() => {
        setBridgeEvents([]);
    }, []);

    return {
        loading,
        error,
        bridgeEvents,
        lockTokens,
        burnTokens,
        sendTokens,
        executeDelayedTransfer,
        registerChain,
        toggleChain,
        setBlockedAddress,
        setMinGasForTransfer,
        clearEvents
    };
};