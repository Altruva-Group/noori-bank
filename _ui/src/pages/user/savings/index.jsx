import { Box, Grid, Paper } from '@mui/material';
import { useUserAccount } from '../../../context/hooks';
import SavingsOverview from '../../../components/user/savings/SavingsOverview';
import InterestHistory from '../../../components/user/savings/InterestHistory';
import ConnectWalletMessage from '../../../components/user/ConnectWalletMessage';

const Savings = () => {
    const { account } = useUserAccount();

    if (!account) {
        return <ConnectWalletMessage />;
    }

    return (
        <Box>
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper elevation={0} sx={{ p: 3 }}>
                        <SavingsOverview />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ p: 3 }}>
                        <InterestHistory />
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Savings;
