import { useMemo } from 'react';
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
} from '@mui/material';
import { useUserAccount } from '../../../context/hooks';
import { fromWei } from '../../../utils/smart-contract/contracts';

const InterestHistory = () => {
    const { web3, transactions } = useUserAccount();

    // Filter and format interest-related transactions
    const interestTransactions = useMemo(() => {
        return transactions
            .filter(tx => tx.event === 'InterestEarned')
            .map(tx => ({
                timestamp: new Date(tx.returnValues.timestamp * 1000),
                amount: fromWei(web3, tx.returnValues.amount),
                totalBalance: fromWei(web3, tx.returnValues.newBalance)
            }))
            .sort((a, b) => b.timestamp - a.timestamp);
    }, [transactions, web3]);

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Interest History
            </Typography>

            <Card>
                <CardContent>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell align="right">Interest Earned</TableCell>
                                    <TableCell align="right">Balance After</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {interestTransactions.map((tx, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            {tx.timestamp.toLocaleDateString()}
                                        </TableCell>
                                        <TableCell align="right">
                                            {tx.amount} NOORI
                                        </TableCell>
                                        <TableCell align="right">
                                            {tx.totalBalance} NOORI
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {interestTransactions.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} align="center">
                                            No interest history available
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

export default InterestHistory;
