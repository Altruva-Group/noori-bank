import { useState, useContext } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Stack,
  CircularProgress,
  Alert
} from '@mui/material';
import UserAccountContext from '../../context/UserAccountContext';

function Savings() {
  const { account, loading: isConnecting, error: walletError } = useContext(UserAccountContext);
  const [amount, setAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDeposit = async () => {
    try {
      setIsDepositing(true);
      setError('');
      // Add deposit logic here using web3 contract calls
      setSuccess('Deposit successful!');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDepositing(false);
    }
  };

  if (isConnecting) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!account) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6">Please connect your wallet to access savings features</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Savings Account
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Earn 10% APR on your deposits
      </Typography>

      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Typography variant="h6">Your Balance: 0 NOORI</Typography>
              <Typography variant="body2" color="text.secondary">
                Interest Earned: 0 NOORI
              </Typography>
              
              <TextField
                label="Amount to Deposit"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                fullWidth
                InputProps={{
                  endAdornment: <Typography>NOORI</Typography>
                }}
              />

              <Button
                variant="contained"
                onClick={handleDeposit}
                disabled={isDepositing || !amount}
                fullWidth
              >
                {isDepositing ? <CircularProgress size={24} /> : 'Deposit'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

export default Savings;
