import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Tooltip,
    Button,
    Stack,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Chip,
} from '@mui/material';
import {
    Block as BlockIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import { useUserAccount } from '../../../context/hooks';
import { fromWei } from '../../../utils/smart-contract/contracts';

const UserManagement = () => {
    const { web3, contracts } = useUserAccount();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [actionDialogOpen, setActionDialogOpen] = useState(false);

    // Fetch users from the smart contract
    const fetchUsers = async () => {
        if (!contracts.vault) return;

        try {
            setLoading(true);
            const userAddresses = await contracts.vault.methods.getAllUsers().call();
            
            const userDetails = await Promise.all(
                userAddresses.map(async (address) => {
                    const [
                        details,
                        vaultBalance,
                        loanBalance,
                        collateralBalance,
                        isBlacklisted
                    ] = await Promise.all([
                        contracts.vault.methods.getUserDetails(address).call(),
                        contracts.vault.methods.getBalance(address).call(),
                        contracts.vault.methods.getLoan(address).call(),
                        contracts.vault.methods.getCollateral(address).call(),
                        contracts.vault.methods.isBlacklisted(address).call(),
                    ]);

                    return {
                        address,
                        registrationDate: new Date(details.registrationTimestamp * 1000),
                        vaultBalance,
                        loanBalance,
                        collateralBalance,
                        isBlacklisted,
                        riskLevel: calculateRiskLevel(loanBalance, collateralBalance)
                    };
                })
            );

            setUsers(userDetails);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('Failed to fetch user data');
        } finally {
            setLoading(false);
        }
    };

    // Calculate user risk level based on loan and collateral
    const calculateRiskLevel = (loan, collateral) => {
        if (loan === '0') return 'NONE';
        
        const loanValue = parseFloat(fromWei(web3, loan));
        const collateralValue = parseFloat(fromWei(web3, collateral));
        const ltv = (loanValue / collateralValue) * 100;

        if (ltv > 75) return 'HIGH';
        if (ltv > 50) return 'MEDIUM';
        return 'LOW';
    };

    // Handle user actions (blacklist/unblacklist)
    const handleUserAction = async (action) => {
        if (!selectedUser) return;

        try {
            setLoading(true);
            const method = action === 'blacklist' 
                ? contracts.vault.methods.blacklistUser(selectedUser.address)
                : contracts.vault.methods.unblacklistUser(selectedUser.address);

            await method.send({ from: web3.eth.defaultAccount });
            await fetchUsers(); // Refresh user list
            setActionDialogOpen(false);
        } catch (error) {
            console.error(`Error ${action}ing user:`, error);
            setError(`Failed to ${action} user`);
        } finally {
            setLoading(false);
        }
    };

    // Filter users based on search term
    const filteredUsers = users.filter(user => 
        user.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Initial load
    useEffect(() => {
        fetchUsers();
        const interval = setInterval(fetchUsers, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, [contracts.vault]);

    return (
        <Box>
            <Stack 
                direction="row" 
                justifyContent="space-between" 
                alignItems="center"
                mb={3}
            >
                <Typography variant="h5">
                    User Management
                </Typography>
                <TextField
                    size="small"
                    placeholder="Search by address"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1 }} />,
                    }}
                />
            </Stack>

            <Card>
                <CardContent>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Address</TableCell>
                                    <TableCell>Registration Date</TableCell>
                                    <TableCell align="right">Balance</TableCell>
                                    <TableCell align="right">Loan</TableCell>
                                    <TableCell align="right">Collateral</TableCell>
                                    <TableCell>Risk Level</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user.address}>
                                        <TableCell>
                                            {`${user.address.slice(0, 6)}...${user.address.slice(-4)}`}
                                        </TableCell>
                                        <TableCell>
                                            {user.registrationDate.toLocaleDateString()}
                                        </TableCell>
                                        <TableCell align="right">
                                            {fromWei(web3, user.vaultBalance)} NOORI
                                        </TableCell>
                                        <TableCell align="right">
                                            {fromWei(web3, user.loanBalance)} NOORI
                                        </TableCell>
                                        <TableCell align="right">
                                            {fromWei(web3, user.collateralBalance)} ETH
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.riskLevel}
                                                color={
                                                    user.riskLevel === 'HIGH' ? 'error' :
                                                    user.riskLevel === 'MEDIUM' ? 'warning' :
                                                    user.riskLevel === 'LOW' ? 'success' :
                                                    'default'
                                                }
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.isBlacklisted ? 'Blacklisted' : 'Active'}
                                                color={user.isBlacklisted ? 'error' : 'success'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip 
                                                title={user.isBlacklisted ? "Remove from blacklist" : "Add to blacklist"}
                                            >
                                                <IconButton
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setActionDialogOpen(true);
                                                    }}
                                                    color={user.isBlacklisted ? "success" : "error"}
                                                >
                                                    {user.isBlacklisted ? <CheckCircleIcon /> : <BlockIcon />}
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center">
                                            No users found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Action Confirmation Dialog */}
            <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)}>
                <DialogTitle>
                    {selectedUser?.isBlacklisted ? 'Remove from Blacklist' : 'Add to Blacklist'}
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to {selectedUser?.isBlacklisted ? 'remove' : 'add'} user 
                        {' '}{selectedUser?.address} {selectedUser?.isBlacklisted ? 'from' : 'to'} the blacklist?
                    </Typography>
                    {!selectedUser?.isBlacklisted && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            This will prevent the user from making any new transactions.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setActionDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => handleUserAction(selectedUser?.isBlacklisted ? 'unblacklist' : 'blacklist')}
                        color={selectedUser?.isBlacklisted ? "success" : "error"}
                        variant="contained"
                        disabled={loading}
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserManagement;
