import { useMemo } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Stack,
    Chip,
    IconButton,
    Tooltip,
    Button,
} from '@mui/material';
import {
    AccountBalance as AccountBalanceIcon,
    Payment as PaymentIcon,
    SwapHoriz as SwapHorizIcon,
    ContentCopy as ContentCopyIcon,
    ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useUserAccount } from '../../../context/hooks';
import { fromWei } from '../../../utils/smart-contract/contracts';
import { useNavigate } from 'react-router-dom';

const ActivityItem = ({ type, icon, title, description, amount, timestamp, color }) => (
    <Stack 
        direction="row" 
        alignItems="center" 
        spacing={2} 
        sx={{ py: 1.5 }}
    >
        <Box
            sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: `${color}.lighter`,
                color: `${color}.main`,
            }}
        >
            {icon}
        </Box>

        <Stack spacing={0.5} flexGrow={1}>
            <Typography variant="subtitle2">
                {title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
                {description}
            </Typography>
        </Stack>

        <Stack alignItems="flex-end" spacing={0.5}>
            <Typography variant="subtitle2" color={amount.startsWith('-') ? 'error.main' : 'success.main'}>
                {amount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
                {timestamp}
            </Typography>
        </Stack>
    </Stack>
);

const RecentActivity = () => {
    const navigate = useNavigate();
    const { web3, account, transactions } = useUserAccount();

    // Format address for display
    const formatAddress = (address) => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    // Copy address to clipboard
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // In production, you'd want to show a toast notification
    };

    // Get recent activity across all features
    const recentActivity = useMemo(() => {
        if (!transactions || !Array.isArray(transactions)) {
            return [];
        }

        return transactions
            .slice(0, 5) // Show only last 5 transactions
            .map(tx => {
                const timestamp = new Date(tx.returnValues.timestamp * 1000);
                const amount = fromWei(web3, tx.returnValues.amount);

                let activityData = {
                    timestamp: timestamp.toLocaleString(),
                };

                switch (tx.event) {
                    case 'Deposit':
                        activityData = {
                            ...activityData,
                            type: 'deposit',
                            icon: <AccountBalanceIcon />,
                            title: 'Deposit to Savings',
                            description: 'Funds added to savings account',
                            amount: `+${amount} NOORI`,
                            color: 'success',
                        };
                        break;

                    case 'Withdrawal':
                        activityData = {
                            ...activityData,
                            type: 'withdrawal',
                            icon: <PaymentIcon />,
                            title: 'Withdrawal from Savings',
                            description: 'Funds withdrawn from savings',
                            amount: `-${amount} NOORI`,
                            color: 'warning',
                        };
                        break;

                    case 'Transfer':
                        { const isOutgoing = tx.returnValues.from === account;
                        activityData = {
                            ...activityData,
                            type: 'transfer',
                            icon: <SwapHorizIcon />,
                            title: isOutgoing ? 'Sent Funds' : 'Received Funds',
                            description: isOutgoing 
                                ? `To: ${formatAddress(tx.returnValues.to)}`
                                : `From: ${formatAddress(tx.returnValues.from)}`,
                            amount: `${isOutgoing ? '-' : '+'}${amount} NOORI`,
                            color: 'info',
                        };
                        break; }

                    case 'LoanCreated':
                        activityData = {
                            ...activityData,
                            type: 'loan',
                            icon: <AccountBalanceIcon />,
                            title: 'Loan Taken',
                            description: `Collateral: ${fromWei(web3, tx.returnValues.collateral)} ETH`,
                            amount: `+${amount} NOORI`,
                            color: 'warning',
                        };
                        break;

                    case 'LoanRepayment':
                        activityData = {
                            ...activityData,
                            type: 'repayment',
                            icon: <PaymentIcon />,
                            title: 'Loan Repayment',
                            description: `Remaining: ${fromWei(web3, tx.returnValues.remainingDebt)} NOORI`,
                            amount: `-${amount} NOORI`,
                            color: 'success',
                        };
                        break;

                    default:
                        return null;
                }

                return activityData;
            })
            .filter(Boolean); // Remove any null entries
    }, [transactions, web3, account]);

    return (
        <Box>
            <Stack 
                direction="row" 
                alignItems="center" 
                justifyContent="space-between"
                mb={2}
            >
                <Typography variant="h5">
                    Recent Activity
                </Typography>
                <Button 
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate('/vault')}
                >
                    View All
                </Button>
            </Stack>

            <Card>
                <CardContent>
                    <Stack divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
                        {recentActivity.map((activity, index) => (
                            <ActivityItem key={index} {...activity} />
                        ))}
                        {recentActivity.length === 0 && (
                            <Typography 
                                variant="body2" 
                                color="text.secondary"
                                align="center"
                                py={3}
                            >
                                No recent activity
                            </Typography>
                        )}
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
};

export default RecentActivity;
