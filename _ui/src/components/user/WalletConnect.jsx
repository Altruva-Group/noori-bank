import { useUserAccount } from '../../context/hooks';
import { Box, Button, Typography, CircularProgress } from '@mui/material';

export const WalletConnect = () => {
  const { 
    account, 
    loading,
    error,
    tokenBalance,
    vaultBalance,
    connectWallet, 
    disconnectWallet 
  } = useUserAccount();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <CircularProgress size={20} />
        <Typography>Connecting...</Typography>
      </Box>
    );
  }

  if (!account) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Button 
          variant="contained" 
          onClick={connectWallet}
          disabled={loading}
        >
          Connect Wallet
        </Button>
        {error && (
          <Typography color="error" sx={{ ml: 2 }}>
            {error}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography>
          {account.slice(0, 6)}...{account.slice(-4)}
        </Typography>
        <Button 
          variant="outlined" 
          onClick={disconnectWallet}
          size="small"
        >
          Disconnect
        </Button>
      </Box>
      <Box sx={{ display: 'flex', gap: 4 }}>
        <Typography variant="body2">
          NOORI: {tokenBalance}
        </Typography>
        <Typography variant="body2">
          Vault: {vaultBalance}
        </Typography>
      </Box>
    </Box>
  );
};
