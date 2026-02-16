import { Box, Grid, Paper } from '@mui/material';
import { useUserAccount } from '../../../context/hooks';
import VaultBalance from '../../../components/user/vault/VaultBalance';
import VaultTransfer from '../../../components/user/vault/VaultTransfer';
import VaultHistory from '../../../components/user/vault/VaultHistory';
import ConnectWalletMessage from '../../../components/user/ConnectWalletMessage';

const Vault = () => {
    const { account } = useUserAccount();

    if (!account) {
        return <ConnectWalletMessage />;
    }

    return (
        <Box>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper elevation={0} sx={{ p: 3 }}>
                        <VaultBalance />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ p: 3 }}>
                        <VaultTransfer />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={8}>
                    <Paper elevation={0} sx={{ p: 3 }}>
                        <VaultHistory />
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Vault;
