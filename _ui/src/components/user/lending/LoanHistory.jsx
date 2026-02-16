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
    Chip,
} from '@mui/material';
import { useUserAccount } from '../../../context/hooks';
import { fromWei } from '../../../utils/smart-contract/contracts';

const LoanHistory = () => {
    const { web3, transactions } = useUserAccount();

    // Filter and format loan-related transactions
    const loanTransactions = useMemo(() => {
        return transactions
            .filter(tx => ['LoanCreated', 'LoanRepayment', 'CollateralAdded', 'CollateralWithdrawn', 'Liquidated'].includes(tx.event))
            .map(tx => {
                const baseInfo = {
                    timestamp: new Date(tx.returnValues.timestamp * 1000),
                    type: tx.event,
                };

                switch (tx.event) {
                    case 'LoanCreated':
                        return {
                            ...baseInfo,
                            loanAmount: fromWei(web3, tx.returnValues.amount),
                            collateral: fromWei(web3, tx.returnValues.collateral),
                        };
                    case 'LoanRepayment':
                        return {
                            ...baseInfo,
                            amount: fromWei(web3, tx.returnValues.amount),
                            remainingDebt: fromWei(web3, tx.returnValues.remainingDebt),
                        };
                    case 'CollateralAdded':
                    case 'CollateralWithdrawn':
                        return {
                            ...baseInfo,
                            amount: fromWei(web3, tx.returnValues.amount),
                            totalCollateral: fromWei(web3, tx.returnValues.totalCollateral),
                        };
                    case 'Liquidated':
                        return {
                            ...baseInfo,
                            debt: fromWei(web3, tx.returnValues.debt),
                            collateral: fromWei(web3, tx.returnValues.collateral),
                        };
                    default:
                        return baseInfo;
                }
            })
            .sort((a, b) => b.timestamp - a.timestamp);
    }, [transactions, web3]);

    const getEventChipColor = (type) => {
        switch (type) {
            case 'LoanCreated':
                return 'primary';
            case 'LoanRepayment':
                return 'success';
            case 'CollateralAdded':
                return 'info';
            case 'CollateralWithdrawn':
                return 'warning';
            case 'Liquidated':
                return 'error';
            default:
                return 'default';
        }
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Loan History
            </Typography>

            <Card>
                <CardContent>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Event</TableCell>
                                    <TableCell align="right">Details</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loanTransactions.map((tx, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            {tx.timestamp.toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={tx.type}
                                                color={getEventChipColor(tx.type)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            {tx.type === 'LoanCreated' && (
                                                <>
                                                    Borrowed {tx.loanAmount} NOORI
                                                    <br />
                                                    Collateral: {tx.collateral} ETH
                                                </>
                                            )}
                                            {tx.type === 'LoanRepayment' && (
                                                <>
                                                    Repaid {tx.amount} NOORI
                                                    <br />
                                                    Remaining: {tx.remainingDebt} NOORI
                                                </>
                                            )}
                                            {(tx.type === 'CollateralAdded' || tx.type === 'CollateralWithdrawn') && (
                                                <>
                                                    {tx.amount} ETH
                                                    <br />
                                                    Total Collateral: {tx.totalCollateral} ETH
                                                </>
                                            )}
                                            {tx.type === 'Liquidated' && (
                                                <>
                                                    Debt Liquidated: {tx.debt} NOORI
                                                    <br />
                                                    Collateral Lost: {tx.collateral} ETH
                                                </>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {loanTransactions.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} align="center">
                                            No loan history available
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

export default LoanHistory;
