import { Box, Grid, Paper } from '@mui/material';
import { useUserAccount } from '../../../context/hooks';
import LoanOverview from '../../../components/user/lending/LoanOverview';
import LoanHistory from '../../../components/user/lending/LoanHistory';
import ConnectWalletMessage from '../../../components/user/ConnectWalletMessage';

const Lending = () => {
    const { account } = useUserAccount();

    if (!account) {
        return <ConnectWalletMessage />;
    }

    return (
        <Box>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper elevation={0} sx={{ p: 3 }}>
                        <LoanOverview />
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Paper elevation={0} sx={{ p: 3 }}>
                        <LoanHistory />
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Lending;
