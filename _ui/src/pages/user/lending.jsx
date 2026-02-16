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
  Alert,
  Divider,
} from '@mui/material';
import UserAccountContext from '../../context/UserAccountContext';

function Lending() {
  const { account, loading: isConnecting, error: walletError } = useContext(UserAccountContext);
  const [collateralAmount, setCollateralAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleBorrow = async () => {
    try {
      setIsProcessing(true);
      setError('');
      // Add borrow logic here using web3 contract calls
      setSuccess('Loan processed successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
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
        <Typography variant="h6">Please connect your wallet to access lending features</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Lending Platform
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Borrow with ETH or ERC20 tokens as collateral
      </Typography>

      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Typography variant="h6">Loan Details</Typography>
              <Typography variant="body2" color="text.secondary">
                Maximum LTV: 60%
                <br />
                Interest Rate: 5% APR
              </Typography>

              <Divider />

              <TextField
                label="Collateral Amount"
                value={collateralAmount}
                onChange={(e) => setCollateralAmount(e.target.value)}
                type="number"
                fullWidth
                InputProps={{
                  endAdornment: <Typography>ETH</Typography>
                }}
              />

              <TextField
                label="Borrow Amount"
                value={borrowAmount}
                onChange={(e) => setBorrowAmount(e.target.value)}
                type="number"
                fullWidth
                InputProps={{
                  endAdornment: <Typography>NOORI</Typography>
                }}
              />

              <Button
                variant="contained"
                onClick={handleBorrow}
                disabled={isProcessing || !collateralAmount || !borrowAmount}
                fullWidth
              >
                {isProcessing ? <CircularProgress size={24} /> : 'Take Loan'}
              </Button>

              <Typography variant="caption" color="text.secondary" align="center">
                By taking a loan, you agree to the terms and conditions of the lending protocol.
                Please ensure you understand the risks involved.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

export default Lending;
