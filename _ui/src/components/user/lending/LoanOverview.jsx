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
    LinearProgress,
    Grid,
} from '@mui/material';
import { useUserAccount } from '../../../context/hooks';
import { toWei, fromWei, calculateLTV } from '../../../utils/smart-contract/contracts';

const LoanOverview = () => {
    const {
        web3,
        account,
        loanBalance,
        collateralBalance,
        systemParams,
        loading,
        error,
        applyForLoan,
        repayLoan,
    } = useUserAccount();

    const [amount, setAmount] = useState('');
    const [collateralAmount, setCollateralAmount] = useState('');
    const [txError, setTxError] = useState('');

    // Calculate current LTV ratio
    const currentLTV = loanBalance && collateralBalance ? 
        calculateLTV(
            parseFloat(fromWei(web3, loanBalance)),
            parseFloat(fromWei(web3, collateralBalance))
        ) : 0;

    // Calculate max borrowable amount based on collateral
    const maxBorrowable = collateralBalance ? 
        parseFloat(fromWei(web3, collateralBalance)) * 
        (parseFloat(fromWei(web3, systemParams.minCollateralRatio)) / 100) : 0;

    const handleApplyLoan = async () => {
        try {
            setTxError('');
            const loanAmountWei = toWei(web3, amount);
            const collateralWei = toWei(web3, collateralAmount);
            await applyForLoan(loanAmountWei, collateralWei);
            setAmount('');
            setCollateralAmount('');
        } catch (err) {
            setTxError(err.message);
        }
    };

    const handleRepayLoan = async () => {
        try {
            setTxError('');
            const repayAmountWei = toWei(web3, amount);
            await repayLoan(repayAmountWei);
            setAmount('');
        } catch (err) {
            setTxError(err.message);
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Lending Dashboard
            </Typography>

            <Grid container spacing={3}>
                {/* Loan Status */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Current Loan Status
                            </Typography>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Outstanding Loan
                                    </Typography>
                                    <Typography variant="h4">
                                        {fromWei(web3, loanBalance)} NOORI
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Collateral Locked
                                    </Typography>
                                    <Typography variant="h4">
                                        {fromWei(web3, collateralBalance)} ETH
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Current LTV Ratio
                                    </Typography>
                                    <LinearProgress 
                                        variant="determinate" 
                                        value={currentLTV}
                                        color={currentLTV > 70 ? "error" : "primary"}
                                        sx={{ height: 10, borderRadius: 1, my: 1 }}
                                    />
                                    <Typography variant="body2">
                                        {currentLTV.toFixed(2)}% (Max: 80%)
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Loan Actions */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                {loanBalance === '0' ? 'Apply for Loan' : 'Manage Loan'}
                            </Typography>
                            <Stack spacing={2}>
                                {loanBalance === '0' ? (
                                    <>
                                        <TextField
                                            label="Loan Amount (NOORI)"
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            fullWidth
                                            InputProps={{
                                                inputProps: { min: 0, step: 0.000001 }
                                            }}
                                        />
                                        <TextField
                                            label="Collateral Amount (ETH)"
                                            type="number"
                                            value={collateralAmount}
                                            onChange={(e) => setCollateralAmount(e.target.value)}
                                            fullWidth
                                            InputProps={{
                                                inputProps: { min: 0, step: 0.000001 }
                                            }}
                                        />
                                        <Button
                                            variant="contained"
                                            onClick={handleApplyLoan}
                                            disabled={!amount || !collateralAmount || loading || !account}
                                            fullWidth
                                        >
                                            Apply for Loan
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <TextField
                                            label="Repayment Amount (NOORI)"
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            fullWidth
                                            InputProps={{
                                                inputProps: { min: 0, max: fromWei(web3, loanBalance), step: 0.000001 }
                                            }}
                                        />
                                        <Button
                                            variant="contained"
                                            onClick={handleRepayLoan}
                                            disabled={!amount || loading || !account}
                                            fullWidth
                                        >
                                            Repay Loan
                                        </Button>
                                    </>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Loan Terms */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Loan Terms & Conditions
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={4}>
                                    <Typography variant="body2" color="text.secondary">
                                        Interest Rate (APR)
                                    </Typography>
                                    <Typography variant="h6">
                                        {systemParams.borrowRate}%
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Typography variant="body2" color="text.secondary">
                                        Maximum LTV Ratio
                                    </Typography>
                                    <Typography variant="h6">
                                        {systemParams.minCollateralRatio}%
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Typography variant="body2" color="text.secondary">
                                        Liquidation Threshold
                                    </Typography>
                                    <Typography variant="h6">
                                        80%
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {(error || txError) && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error || txError}
                </Alert>
            )}
        </Box>
    );
};

export default LoanOverview;
