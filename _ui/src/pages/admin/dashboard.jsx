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
  Paper,
  Switch,
  FormControlLabel
} from '@mui/material';
import UserAccountContext from '../../context/UserAccountContext';

function AdminDashboard() {
  const { account, loading: isConnecting, error: walletError } = useContext(UserAccountContext);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [systemData, setSystemData] = useState({
    totalDeposits: '0',
    totalLoans: '0',
    activeUsers: '0',
    isPaused: false,
    recentTransactions: []
  });

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Add admin check logic here
        setIsAdmin(true); // Temporary, replace with actual check
      } catch (err) {
        setError(err.message);
      }
    };

    const fetchSystemData = async () => {
      try {
        setIsLoading(true);
        // Add system data fetching logic here
        setSystemData({
          totalDeposits: '1000000',
          totalLoans: '500000',
          activeUsers: '100',
          isPaused: false,
          recentTransactions: [
            { id: 1, type: 'Deposit', amount: '10000', user: '0x123...', timestamp: new Date().toISOString() },
            { id: 2, type: 'Loan', amount: '5000', user: '0x456...', timestamp: new Date().toISOString() }
          ]
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (account) {
      checkAdminStatus();
      fetchSystemData();
    }
  }, [account]);

  if (isConnecting || isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!account || !isAdmin) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6">Access Denied</Typography>
        <Typography variant="body1" color="text.secondary">
          You need admin privileges to access this page.
        </Typography>
      </Box>
    );
  }

  const handleEmergencyPause = async () => {
    try {
      // Add emergency pause logic here
      setSystemData(prev => ({ ...prev, isPaused: !prev.isPaused }));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">System Overview</Typography>
              <Stack direction="row" spacing={2} justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Deposits</Typography>
                  <Typography variant="h6">{systemData.totalDeposits} NOORI</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Loans</Typography>
                  <Typography variant="h6">{systemData.totalLoans} NOORI</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Active Users</Typography>
                  <Typography variant="h6">{systemData.activeUsers}</Typography>
                </Box>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">System Controls</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={systemData.isPaused}
                    onChange={handleEmergencyPause}
                    color="warning"
                  />
                }
                label="Emergency Pause"
              />
              <Button variant="contained" color="primary">
                Update Interest Rates
              </Button>
              <Button variant="outlined" color="secondary">
                Manage Blacklist
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Transactions
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {systemData.recentTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{tx.type}</TableCell>
                      <TableCell>{tx.user}</TableCell>
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

export default AdminDashboard;
