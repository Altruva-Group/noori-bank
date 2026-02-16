import { Box, Grid, Paper } from '@mui/material';
import { useUserAccount } from '../../../context/hooks';
import AccountSummary from '../../../components/user/dashboard/AccountSummary';
import RecentActivity from '../../../components/user/dashboard/RecentActivity';
import ConnectWalletMessage from '../../../components/user/ConnectWalletMessage';

const Dashboard = () => {
    const { account } = useUserAccount();    if (!account) {
        return <ConnectWalletMessage />;
    }

    return (
        <Box>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper elevation={0} sx={{ p: 3 }}>
                        <AccountSummary />
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Paper elevation={0} sx={{ p: 3 }}>
                        <RecentActivity />
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;



// USER FEATURES 
    // register 
    // account details
    // generate memo
    // erc20Balance
    // get tx hx
    // verify kyc 
    // get asset price
    // cal asset value
    // calc account worth 
    // recover account
    
    // deposit eth
    // deposit erc20
    // deposit nativeToken
    
    // transfer eth
    // transfer erc20
    // transfer nativeToken
    // get transfer fee
    
    // withdraw eth
    // withdraw erc20 
    // withdraw nativeToken
    // get withdrawal fee