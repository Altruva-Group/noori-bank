import { useMemo, useState } from 'react';
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
    Chip,
    IconButton,
    Tooltip,
    MenuItem,
    Select,
    Stack,
    FormControl,
    InputLabel,
} from '@mui/material';
import {
    ContentCopy as ContentCopyIcon,
    CallMade as CallMadeIcon,
    CallReceived as CallReceivedIcon,
} from '@mui/icons-material';
import { useUserAccount } from '../../../context/hooks';
import { fromWei } from '../../../utils/smart-contract/contracts';

const VaultHistory = () => {
    const { web3, account, transactions } = useUserAccount();
    const [filter, setFilter] = useState('all');

    // Copy address to clipboard
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // In a production app, you'd want to show a toast notification here
    };

    // Filter and format transactions
    const vaultTransactions = useMemo(() => {
        return transactions
            .filter(tx => {
                if (filter === 'all') return true;
                return tx.event.toLowerCase() === filter;
            })
            .map(tx => {
                const timestamp = new Date(tx.returnValues.timestamp * 1000);
                const amount = fromWei(web3, tx.returnValues.amount);

                let type = tx.event;
                let from = tx.returnValues.from || account;
                let to = tx.returnValues.to;
                let fee = '0';

                if (tx.event === 'Transfer') {
                    fee = fromWei(web3, tx.returnValues.fee);
                }

                return {
                    timestamp,
                    type,
                    amount,
                    from,
                    to,
                    fee,
                    hash: tx.transactionHash,
                };
            })
            .sort((a, b) => b.timestamp - a.timestamp);
    }, [transactions, web3, account, filter]);

    const getTransactionColor = (type) => {
        switch (type.toLowerCase()) {
            case 'deposit':
                return 'success';
            case 'withdrawal':
                return 'warning';
            case 'transfer':
                return 'info';
            default:
                return 'default';
        }
    };

    const formatAddress = (address) => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const getTransactionIcon = (type, isOutgoing) => {
        if (type.toLowerCase() === 'transfer') {
            return isOutgoing ? <CallMadeIcon /> : <CallReceivedIcon />;
        }
        return null;
    };

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5">
                    Transaction History
                </Typography>

                <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Filter</InputLabel>
                    <Select
                        value={filter}
                        label="Filter"
                        onChange={(e) => setFilter(e.target.value)}
                        size="small"
                    >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="deposit">Deposits</MenuItem>
                        <MenuItem value="withdrawal">Withdrawals</MenuItem>
                        <MenuItem value="transfer">Transfers</MenuItem>
                    </Select>
                </FormControl>
            </Stack>

            <Card>
                <CardContent>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Amount</TableCell>
                                    <TableCell>From</TableCell>
                                    <TableCell>To</TableCell>
                                    <TableCell>Fee</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {vaultTransactions.map((tx, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            {tx.timestamp.toLocaleDateString()}
                                            <br />
                                            <Typography variant="caption" color="text.secondary">
                                                {tx.timestamp.toLocaleTimeString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                {getTransactionIcon(tx.type, tx.from === account)}
                                                <Chip 
                                                    label={tx.type}
                                                    color={getTransactionColor(tx.type)}
                                                    size="small"
                                                />
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                color={tx.from === account ? 'error.main' : 'success.main'}
                                            >
                                                {tx.from === account ? '-' : '+'}{tx.amount} NOORI
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                {formatAddress(tx.from)}
                                                <Tooltip title="Copy Address">
                                                    <IconButton 
                                                        size="small"
                                                        onClick={() => copyToClipboard(tx.from)}
                                                    >
                                                        <ContentCopyIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                {formatAddress(tx.to)}
                                                {tx.to && (
                                                    <Tooltip title="Copy Address">
                                                        <IconButton 
                                                            size="small"
                                                            onClick={() => copyToClipboard(tx.to)}
                                                        >
                                                            <ContentCopyIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            {tx.fee !== '0' ? `${tx.fee} NOORI` : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {vaultTransactions.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            No transactions found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        </Box>
    );
};

export default VaultHistory;
