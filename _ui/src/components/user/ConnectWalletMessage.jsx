import { Box, Button, Typography, CircularProgress } from '@mui/material';
import { useUserAccount } from '../../context/hooks';

const ConnectWalletMessage = () => {
    const { connectWallet, loading, error } = useUserAccount();

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '50vh',
                textAlign: 'center',
                gap: 2
            }}
        >
            <Typography variant="h5" gutterBottom>
                Connect Your Wallet
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                Please connect your wallet to access this feature.
            </Typography>
            {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={24} />
                    <Typography>Connecting...</Typography>
                </Box>
            ) : (
                <>
                    <Button
                        variant="contained"
                        onClick={connectWallet}
                        size="large"
                        disabled={loading}
                    >
                        Connect Wallet
                    </Button>
                    {error && (
                        <Typography color="error">
                            {error}
                        </Typography>
                    )}
                </>
            )}
        </Box>
    );
};

export default ConnectWalletMessage;
