import { useState, useEffect } from 'react';
import {
  Stack,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Snackbar,
  Box
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useUserAccount } from '../../context/hooks';
import web3Service from '../../utils/smart-contract/web3';

export const VaultInterface = () => {
  const theme = useTheme();
  const { account, vaultContractRef, tokenContractRef } = useUserAccount();
  const [amount, setAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    if (!amount || isNaN(amount)) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      const weiAmount = web3Service.web3.utils.toWei(amount);
      
      if (isDepositing) {
        // First approve tokens
        await tokenContractRef.current.methods.approve(
          import.meta.env.VITE_VAULT_CA,
          weiAmount
        ).send({ from: account });
        
        // Then deposit
        await vaultContractRef.current.methods.deposit(
          weiAmount,
          account
        ).send({ from: account });
        
        setSuccess('Deposit successful!');
      } else {
        await vaultContractRef.current.methods.withdraw(
          weiAmount,
          account,
          account
        ).send({ from: account });
        
        setSuccess('Withdrawal successful!');
      }

      setAmount('');
      // Trigger balance refresh through context
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <Stack spacing={2} alignItems="center">
        <Alert severity="info">
          Please connect your wallet to access the vault
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={4} sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Typography variant="h5" gutterBottom>
            Vault Operations
          </Typography>
          
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <Button
                variant={isDepositing ? "contained" : "outlined"}
                onClick={() => setIsDepositing(true)}
                fullWidth
              >
                Deposit
              </Button>
              
              <Button
                variant={!isDepositing ? "contained" : "outlined"}
                onClick={() => setIsDepositing(false)}
                fullWidth
              >
                Withdraw
              </Button>
            </Stack>

            <TextField
              label="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              inputProps={{ min: 0, step: 0.1 }}
              fullWidth
              data-testid="amount-input"
            />
            
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading || !amount}
              fullWidth
              data-testid="submit-button"
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                isDepositing ? 'Deposit' : 'Withdraw'
              )}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <VaultStats />
      </Paper>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>
    </Stack>
  );
};

const VaultStats = () => {
  const { contracts } = useWeb3();
  const [stats, setStats] = useState({
    totalAssets: '0',
    apy: '10.00', // Fixed 10% APR
    dailyRate: '0.0274' // (1 + 0.10)^(1/365) - 1
  });

  // Fetch total assets
  const fetchStats = async () => {
    try {
      const totalAssets = await contracts.vault.methods.totalAssets().call();
      setStats(prev => ({
        ...prev,
        totalAssets: web3.utils.fromWei(totalAssets)
      }));
    } catch (error) {
      console.error("Error fetching vault stats:", error);
    }
  };

  useEffect(() => {
    if (contracts.vault) {
      fetchStats();
      // Refresh every minute
      const interval = setInterval(fetchStats, 60000);
      return () => clearInterval(interval);
    }
  }, [contracts.vault]);

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Vault Statistics</Typography>
      
      <Stack spacing={2} divider={<Divider />}>
        <Box>
          <Typography color="text.secondary" gutterBottom>
            Total Value Locked
          </Typography>
          <Typography variant="h6">
            {Number(stats.totalAssets).toLocaleString()} NOORI
          </Typography>
        </Box>
        
        <Box>
          <Typography color="text.secondary" gutterBottom>
            Annual Percentage Rate
          </Typography>
          <Typography variant="h6">
            {stats.apy}%
          </Typography>
        </Box>
        
        <Box>
          <Typography color="text.secondary" gutterBottom>
            Daily Interest Rate
          </Typography>
          <Typography variant="h6">
            {stats.dailyRate}%
          </Typography>
        </Box>
      </Stack>
    </Stack>
  );
};
