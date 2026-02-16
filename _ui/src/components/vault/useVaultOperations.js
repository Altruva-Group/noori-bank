import { useState } from 'react';
import { useUserAccount } from '../../context/hooks';
import { 
    vaultDepositETH,
    vaultDepositERC20,
    vaultDepositNativeToken,
    vaultWithdrawETH,
    vaultWithdrawERC20,
    vaultWithdrawNativeToken,
    vaultTransferETH,
    vaultTransferERC20,
    vaultTransferNativeToken
} from '../../utils/smart-contract/blockchain';

export const useVaultOperations = () => {
    const { loading, setLoading, setError } = useUserAccount();
    const [transactionStatus, setTransactionStatus] = useState(null);

    const handleDeposit = async (type, amount, tokenAddress = null, tokenName = null) => {
        try {
            setLoading(true);
            setError(null);
            setTransactionStatus(null);
            
            let result;
            switch(type) {
                case 'ETH':
                    result = await vaultDepositETH(amount);
                    break;
                case 'ERC20':
                    if (!tokenAddress || !tokenName) throw new Error('Token details required for ERC20 deposit');
                    result = await vaultDepositERC20(tokenName, tokenAddress, amount);
                    break;
                case 'NOORI':
                    result = await vaultDepositNativeToken(amount);
                    break;
                default:
                    throw new Error('Invalid deposit type');
            }

            if (result.success) {
                setTransactionStatus({ type: 'success', message: result.message });
                return true;
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            console.error('Deposit error:', err);
            setError(err.message || 'Failed to process deposit');
            setTransactionStatus({ type: 'error', message: err.message });
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async (type, amount, masterPassword, tokenAddress = null, tokenName = null) => {
        try {
            setLoading(true);
            setError(null);
            setTransactionStatus(null);

            let result;
            switch(type) {
                case 'ETH':
                    result = await vaultWithdrawETH(amount, masterPassword);
                    break;
                case 'ERC20':
                    if (!tokenAddress || !tokenName) throw new Error('Token details required for ERC20 withdrawal');
                    result = await vaultWithdrawERC20(tokenName, tokenAddress, amount, masterPassword);
                    break;
                case 'NOORI':
                    result = await vaultWithdrawNativeToken(amount, masterPassword);
                    break;
                default:
                    throw new Error('Invalid withdrawal type');
            }

            if (result.success) {
                setTransactionStatus({ type: 'success', message: result.message });
                return true;
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            console.error('Withdrawal error:', err);
            setError(err.message || 'Failed to process withdrawal');
            setTransactionStatus({ type: 'error', message: err.message });
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleTransfer = async (type, amount, masterPassword, to = null, memo = null, tokenAddress = null, tokenName = null) => {
        try {
            if (!to && !memo) throw new Error('Recipient address or memo required');
            
            setLoading(true);
            setError(null);
            setTransactionStatus(null);

            let result;
            switch(type) {
                case 'ETH':
                    result = await vaultTransferETH(amount, masterPassword, to, memo);
                    break;
                case 'ERC20':
                    if (!tokenAddress || !tokenName) throw new Error('Token details required for ERC20 transfer');
                    result = await vaultTransferERC20(tokenName, tokenAddress, amount, to, masterPassword, memo);
                    break;
                case 'NOORI':
                    result = await vaultTransferNativeToken(to, amount, masterPassword, memo);
                    break;
                default:
                    throw new Error('Invalid transfer type');
            }

            if (result.success) {
                setTransactionStatus({ type: 'success', message: result.message });
                return true;
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            console.error('Transfer error:', err);
            setError(err.message || 'Failed to process transfer');
            setTransactionStatus({ type: 'error', message: err.message });
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        handleDeposit,
        handleWithdraw,
        handleTransfer,
        loading,
        transactionStatus
    };
};
