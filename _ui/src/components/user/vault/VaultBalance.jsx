import { useMemo } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Stack,
    LinearProgress,
    Divider,
} from '@mui/material';
import { useUserAccount } from '../../../context/hooks';
import { fromWei } from '../../../utils/smart-contract/contracts';

const TokenBalance = ({ symbol, balance, usdValue }) => (
    <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
            {symbol}
        </Typography>
        <Typography variant="h6">
            {balance} {symbol}
        </Typography>
        {usdValue && (
            <Typography variant="caption" color="text.secondary">
                ≈ ${usdValue} USD
            </Typography>
        )}
    </Box>
);

const VaultBalance = () => {
    const {
        web3,
        account,
        tokenBalance,
        vaultBalance,
        transactions,
        systemParams
    } = useUserAccount();

    // Calculate total value and token distributions
    const balanceStats = useMemo(() => {
        const totalBalance = parseFloat(fromWei(web3, vaultBalance));
        const nativeTokens = parseFloat(fromWei(web3, tokenBalance));
        
        // Mock USD values - in production, these would come from an oracle
        const nooriPrice = 1; // 1 NOORI = 1 USD (stablecoin)
        const totalUsdValue = totalBalance * nooriPrice;

        return {
            totalBalance,
            nativeTokens,
            totalUsdValue,
            distribution: [
                {
                    symbol: 'NOORI',
                    balance: nativeTokens,
                    usdValue: nativeTokens * nooriPrice,
                    percentage: (nativeTokens / totalBalance) * 100
                },
                // Add other tokens here as they're supported
            ]
        };
    }, [web3, vaultBalance, tokenBalance]);

    // Calculate monthly growth
    const monthlyGrowth = useMemo(() => {
        const now = new Date();
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        
        const monthlyTransactions = transactions
            .filter(tx => 
                new Date(tx.returnValues.timestamp * 1000) > monthAgo &&
                ['Deposit', 'Withdrawal', 'Transfer'].includes(tx.event)
            );

        const netChange = monthlyTransactions.reduce((acc, tx) => {
            const amount = parseFloat(fromWei(web3, tx.returnValues.amount));
            return acc + (tx.event === 'Deposit' ? amount : -amount);
        }, 0);

        return netChange;
    }, [transactions, web3]);

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Vault Balance
            </Typography>

            <Grid container spacing={3}>
                {/* Total Balance Card */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Total Balance
                            </Typography>
                            <Typography variant="h3">
                                {balanceStats.totalBalance.toFixed(4)} NOORI
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                ≈ ${balanceStats.totalUsdValue.toFixed(2)} USD
                            </Typography>
                            
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    30-Day Growth
                                </Typography>
                                <Typography 
                                    variant="h6" 
                                    color={monthlyGrowth >= 0 ? 'success.main' : 'error.main'}
                                >
                                    {monthlyGrowth >= 0 ? '+' : ''}{monthlyGrowth.toFixed(2)} NOORI
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Token Distribution Card */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Token Distribution
                            </Typography>
                            <Stack spacing={2}>
                                {balanceStats.distribution.map((token, index) => (
                                    <Box key={token.symbol}>
                                        <Stack 
                                            direction="row" 
                                            justifyContent="space-between"
                                            alignItems="center"
                                            mb={1}
                                        >
                                            <TokenBalance {...token} />
                                            <Typography variant="body2">
                                                {token.percentage.toFixed(1)}%
                                            </Typography>
                                        </Stack>
                                        <LinearProgress 
                                            variant="determinate" 
                                            value={token.percentage}
                                            sx={{ height: 8, borderRadius: 1 }}
                                        />
                                        {index < balanceStats.distribution.length - 1 && (
                                            <Divider sx={{ my: 2 }} />
                                        )}
                                    </Box>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default VaultBalance;
