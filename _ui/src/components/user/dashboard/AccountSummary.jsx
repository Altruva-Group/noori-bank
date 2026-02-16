import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Stack,
    LinearProgress,
    Divider,
} from '@mui/material';
import { useUserAccount } from '../../../context/hooks';
import { fromWei, calculateLTV } from '../../../utils/smart-contract/contracts';

const StatCard = ({ title, value, subtitle, color }) => (
    <Card>
        <CardContent>
            <Typography variant="h6" gutterBottom color="text.secondary">
                {title}
            </Typography>
            <Typography variant="h4" color={color || 'text.primary'}>
                {value || '0'}
            </Typography>
            {subtitle && (
                <Typography variant="body2" color="text.secondary">
                    {subtitle}
                </Typography>
            )}
        </CardContent>
    </Card>
);

const AccountSummary = () => {
    const {
        web3,
        account,
        tokenBalance,
        vaultBalance,
        collateralBalance,
        loanBalance,
        interestEarned,
        systemParams
    } = useUserAccount();

    // Early return if web3 is not initialized
    if (!web3) {
        return (
            <Box>
                <Typography variant="h5" gutterBottom>
                    Account Summary
                </Typography>
                <Typography color="text.secondary">
                    Loading web3...
                </Typography>
            </Box>
        );
    }

    // Calculate total value
    const totalValue = (parseFloat(fromWei(web3, vaultBalance || '0')) +
        parseFloat(fromWei(web3, tokenBalance || '0'))) || 0;

    // Calculate Loan Health
    const ltv = loanBalance && collateralBalance ?
        calculateLTV(
            parseFloat(fromWei(web3, loanBalance)),
            parseFloat(fromWei(web3, collateralBalance))
        ) : 0;
    
    const ltvColor = ltv > 70 ? 'error.main' : ltv > 50 ? 'warning.main' : 'success.main';

    // Calculate APY with null checks
    const savingsAPY = systemParams?.depositRate ? 
        parseFloat(fromWei(web3, systemParams.depositRate)) : 0;
    const lendingAPR = systemParams?.borrowRate ? 
        parseFloat(fromWei(web3, systemParams.borrowRate)) : 0;

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Account Summary
            </Typography>

            <Grid container spacing={3}>
                {/* Total Value */}
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Value"
                        value={totalValue ? `${totalValue.toFixed(4)} NOORI` : '0 NOORI'}
                        subtitle="Across all accounts"
                    />
                </Grid>

                {/* Savings Balance */}
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Savings Balance"
                        value={`${fromWei(web3, vaultBalance || '0')} NOORI`}
                        subtitle={savingsAPY ? `${savingsAPY}% APY` : 'Loading APY...'}
                        color="primary.main"
                    />
                </Grid>

                {/* Active Loans */}
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Active Loans"
                        value={`${fromWei(web3, loanBalance || '0')} NOORI`}
                        subtitle={lendingAPR ? `${lendingAPR}% APR` : 'Loading APR...'}
                        color={loanBalance && loanBalance !== '0' ? 'warning.main' : 'text.primary'}
                    />
                </Grid>

                {/* Interest Earned */}
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Interest Earned"
                        value={`${fromWei(web3, interestEarned || '0')} NOORI`}
                    />
                </Grid>

                {/* Loan Health - only show if there's an active loan */}
                {loanBalance !== '0' && (
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Stack spacing={2}>
                                    <Typography variant="h6">
                                        Loan Health
                                    </Typography>
                                    <Box>
                                        <Stack 
                                            direction="row" 
                                            justifyContent="space-between"
                                            alignItems="center"
                                            mb={1}
                                        >
                                            <Typography variant="body2" color="text.secondary">
                                                Loan-to-Value (LTV) Ratio
                                            </Typography>
                                            <Typography variant="body2" color={ltvColor}>
                                                {ltv.toFixed(2)}%
                                            </Typography>
                                        </Stack>
                                        <LinearProgress 
                                            variant="determinate" 
                                            value={ltv}
                                            color={ltv > 70 ? "error" : ltv > 50 ? "warning" : "success"}
                                            sx={{ height: 8, borderRadius: 1 }}
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                            Liquidation threshold: 80%
                                        </Typography>
                                    </Box>
                                    <Divider />
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                Collateral Locked
                                            </Typography>
                                            <Typography variant="h6">
                                                {fromWei(web3, collateralBalance)} ETH
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                Outstanding Debt
                                            </Typography>
                                            <Typography variant="h6">
                                                {fromWei(web3, loanBalance)} NOORI
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default AccountSummary;
