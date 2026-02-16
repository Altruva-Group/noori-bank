import { useState } from 'react';
import { 
    Box,
    Stack,
    Typography,
    Card,
    CardContent,
    Button,
    TextField,
    Alert,
} from '@mui/material';
import { useUserAccount } from '../../../context/hooks';
import { toWei, fromWei } from '../../../utils/smart-contract/contracts';

const SavingsOverview = () => {
    const { 
        web3,
        account,
        vaultBalance,
        interestEarned,
        systemParams,
        loading,
        error,
        depositToVault,
        withdrawFromVault
    } = useUserAccount();

    const [amount, setAmount] = useState('');
    const [txError, setTxError] = useState('');

    const handleDeposit = async () => {
        try {
            setTxError('');
            const weiAmount = toWei(web3, amount);
            await depositToVault(weiAmount);
            setAmount('');
        } catch (err) {
            setTxError(err.message);
        }
    };

    const handleWithdraw = async () => {
        try {
            setTxError('');
            const weiAmount = toWei(web3, amount);
            await withdrawFromVault(weiAmount);
            setAmount('');
        } catch (err) {
            setTxError(err.message);
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Savings Account
            </Typography>

            <Stack spacing={3}>
                {/* Balance Card */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Current Balance
                        </Typography>
                        <Typography variant="h3">
                            {fromWei(web3, vaultBalance)} NOORI
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            Interest Earned: {fromWei(web3, interestEarned)} NOORI
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                            APR: {systemParams.depositRate}%
                        </Typography>
                    </CardContent>
                </Card>

                {/* Deposit/Withdraw Form */}
                <Card>
                    <CardContent>
                        <Stack spacing={2}>
                            <TextField
                                label="Amount (NOORI)"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                fullWidth
                                InputProps={{
                                    inputProps: { min: 0, step: 0.000001 }
                                }}
                            />

                            <Stack direction="row" spacing={2}>
                                <Button
                                    variant="contained"
                                    onClick={handleDeposit}
                                    disabled={!amount || loading || !account}
                                    fullWidth
                                >
                                    Deposit
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleWithdraw}
                                    disabled={!amount || loading || !account}
                                    fullWidth
                                >
                                    Withdraw
                                </Button>
                            </Stack>

                            {(error || txError) && (
                                <Alert severity="error">
                                    {error || txError}
                                </Alert>
                            )}
                        </Stack>
                    </CardContent>
                </Card>

                {/* Features Info */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Features & Benefits
                        </Typography>
                        <Typography variant="body1" paragraph>
                            • 10% Annual Interest Rate (APR)
                        </Typography>
                        <Typography variant="body1" paragraph>
                            • Daily compound interest
                        </Typography>
                        <Typography variant="body1" paragraph>
                            • Free deposits
                        </Typography>
                        <Typography variant="body1">
                            • Withdrawal fee: {systemParams.withdrawalFee}%
                        </Typography>
                    </CardContent>
                </Card>
            </Stack>
        </Box>
    );
};

export default SavingsOverview;
