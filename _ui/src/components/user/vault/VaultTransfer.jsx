import { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Alert,
    Stack,
    Divider,
    InputAdornment,
} from '@mui/material';
import { useUserAccount } from '../../../context/hooks';
import { toWei, fromWei } from '../../../utils/smart-contract/contracts';

const VaultTransfer = () => {
    const {
        web3,
        account,
        vaultBalance,
        systemParams,
        loading,
        error,
        transferFunds
    } = useUserAccount();

    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [txError, setTxError] = useState('');

    // Calculate transfer fee
    const transferFeePercentage = systemParams.transferFee;
    const transferFeeAmount = amount ? (parseFloat(amount) * transferFeePercentage) / 100 : 0;
    const totalAmount = amount ? parseFloat(amount) + transferFeeAmount : 0;

    const handleTransfer = async () => {
        if (!web3.utils.isAddress(recipient)) {
            setTxError('Invalid recipient address');
            return;
        }

        try {
            setTxError('');
            const transferAmount = toWei(web3, amount);
            await transferFunds(recipient, transferAmount);
            setAmount('');
            setRecipient('');
        } catch (err) {
            setTxError(err.message);
        }
    };

    const availableBalance = fromWei(web3, vaultBalance);

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Transfer Funds
            </Typography>

            <Card>
                <CardContent>
                    <Stack spacing={3}>
                        <TextField
                            label="Recipient Address"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            fullWidth
                            placeholder="0x..."
                        />

                        <TextField
                            label="Amount (NOORI)"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            fullWidth
                            InputProps={{
                                inputProps: { 
                                    min: 0,
                                    max: availableBalance,
                                    step: 0.000001 
                                },
                                endAdornment: (
                                    <InputAdornment position="end">
                                        NOORI
                                    </InputAdornment>
                                )
                            }}
                        />

                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Transfer Details
                            </Typography>
                            <Stack spacing={1} mt={1}>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="body2">Amount:</Typography>
                                    <Typography variant="body2">{amount || '0'} NOORI</Typography>
                                </Stack>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="body2">Transfer Fee ({transferFeePercentage}%):</Typography>
                                    <Typography variant="body2">{transferFeeAmount.toFixed(6)} NOORI</Typography>
                                </Stack>
                                <Divider />
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="body2" fontWeight="bold">Total:</Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                        {totalAmount.toFixed(6)} NOORI
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Box>

                        <Button
                            variant="contained"
                            onClick={handleTransfer}
                            disabled={!amount || !recipient || loading || !account || totalAmount > availableBalance}
                            fullWidth
                        >
                            Transfer
                        </Button>

                        {totalAmount > availableBalance && (
                            <Alert severity="error">
                                Insufficient balance. Maximum available: {availableBalance} NOORI
                            </Alert>
                        )}

                        {(error || txError) && (
                            <Alert severity="error">
                                {error || txError}
                            </Alert>
                        )}

                        <Alert severity="info">
                            • Transfer fee: {transferFeePercentage}%
                            <br />
                            • Transactions are irreversible
                            <br />
                            • Always verify the recipient address
                        </Alert>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
};

export default VaultTransfer;
