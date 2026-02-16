import { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import UserAccountContext from '../../context/UserAccountContext';

function Vault() {
  const { account, loading: isConnecting, error: walletError } = useContext(UserAccountContext);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [vaultData, setVaultData] = useState({
    balance: '0',
    transactions: []
  });

  useEffect(() => {
    const fetchVaultData = async () => {
      try {
        setIsLoading(true);
        // Add vault data fetching logic here using web3 contract calls
        setVaultData({
          balance: '1000',
          transactions: [
            { id: 1, type: 'Deposit', amount: '500', timestamp: new Date().toISOString() },
            { id: 2, type: 'Withdrawal', amount: '200', timestamp: new Date().toISOString() }
          ]
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (account) {
      fetchVaultData();
    }
  }, [account]);

  if (isConnecting || isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!account) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6">Please connect your wallet to access your vault</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Your Vault
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Manage your assets and view transaction history
      </Typography>

      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">Vault Balance</Typography>
              <Typography variant="h4">{vaultData.balance} NOORI</Typography>
              
              <Stack direction="row" spacing={2}>
                <Button variant="contained" color="primary" fullWidth>
                  Deposit
                </Button>
                <Button variant="outlined" color="primary" fullWidth>
                  Withdraw
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Transaction History
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vaultData.transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{tx.type}</TableCell>
                      <TableCell align="right">{tx.amount} NOORI</TableCell>
                      <TableCell align="right">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

export default Vault;
