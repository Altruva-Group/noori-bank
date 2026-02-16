import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Stack,
    LinearProgress,
    Divider,
} from '@mui/material';
import { useUserAccount } from '../../../context/hooks';
import { fromWei } from '../../../utils/smart-contract/contracts';

const MetricCard = ({ title, value, subtitle, color, progress }) => (
    <Card>
        <CardContent>
            <Typography variant="h6" gutterBottom color="text.secondary">
                {title}
            </Typography>
            <Typography variant="h4" color={color}>
                {value}
            </Typography>
            {subtitle && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    {subtitle}
                </Typography>
            )}
            {progress !== undefined && (
                <LinearProgress 
                    variant="determinate" 
                    value={progress}
                    color={color || "primary"}
                    sx={{ height: 6, borderRadius: 1, mt: 1 }}
                />
            )}
        </CardContent>
    </Card>
);

const SystemMetrics = () => {
    const {
        web3,
        contracts,
        systemParams
    } = useUserAccount();

    // System metrics state
    const [metrics, setMetrics] = useState({
        totalSupply: '0',
        totalDeposits: '0',
        totalLoans: '0',
        totalCollateral: '0',
        activeUsers: 0,
        systemUtilization: 0
    });

    // Fetch system metrics
    useEffect(() => {
        const fetchMetrics = async () => {
            if (!contracts.vault || !contracts.token) return;

            try {
                const [
                    totalSupply,
                    totalDeposits,
                    totalLoans,
                    totalCollateral,
                    activeUsers
                ] = await Promise.all([
                    contracts.token.methods.totalSupply().call(),
                    contracts.vault.methods.getTotalDeposits().call(),
                    contracts.vault.methods.getTotalLoans().call(),
                    contracts.vault.methods.getTotalCollateral().call(),
                    contracts.vault.methods.getActiveUsers().call(),
                ]);

                // Calculate system utilization (loans/deposits ratio)
                const utilizationRate = totalDeposits !== '0' 
                    ? (parseFloat(totalLoans) / parseFloat(totalDeposits)) * 100 
                    : 0;

                setMetrics({
                    totalSupply,
                    totalDeposits,
                    totalLoans,
                    totalCollateral,
                    activeUsers: parseInt(activeUsers),
                    systemUtilization: utilizationRate
                });
            } catch (error) {
                console.error('Error fetching system metrics:', error);
            }
        };

        fetchMetrics();
        // Set up a refresh interval
        const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [contracts.vault, contracts.token]);

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                System Metrics
            </Typography>

            <Grid container spacing={3}>
                {/* Total Value Locked */}
                <Grid item xs={12} sm={6} md={4}>
                    <MetricCard
                        title="Total Value Locked"
                        value={`${fromWei(web3, metrics.totalDeposits)} NOORI`}
                        subtitle="Total deposits in the system"
                    />
                </Grid>

                {/* Total Loans */}
                <Grid item xs={12} sm={6} md={4}>
                    <MetricCard
                        title="Total Loans"
                        value={`${fromWei(web3, metrics.totalLoans)} NOORI`}
                        subtitle="Outstanding loans"
                        color={metrics.systemUtilization > 80 ? "error" : "primary"}
                    />
                </Grid>

                {/* Total Collateral */}
                <Grid item xs={12} sm={6} md={4}>
                    <MetricCard
                        title="Total Collateral"
                        value={`${fromWei(web3, metrics.totalCollateral)} ETH`}
                        subtitle="Locked collateral"
                    />
                </Grid>

                {/* System Utilization */}
                <Grid item xs={12} sm={6}>
                    <MetricCard
                        title="System Utilization"
                        value={`${metrics.systemUtilization.toFixed(2)}%`}
                        subtitle="Loan to Deposit Ratio"
                        progress={metrics.systemUtilization}
                        color={metrics.systemUtilization > 80 ? "error" : 
                               metrics.systemUtilization > 60 ? "warning" : "success"}
                    />
                </Grid>

                {/* Active Users */}
                <Grid item xs={12} sm={6}>
                    <MetricCard
                        title="Active Users"
                        value={metrics.activeUsers.toString()}
                        subtitle="Registered accounts"
                    />
                </Grid>

                {/* System Parameters Card */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                System Parameters
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="body2" color="text.secondary">
                                        Deposit APY
                                    </Typography>
                                    <Typography variant="h6">
                                        {fromWei(web3, systemParams.depositRate)}%
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="body2" color="text.secondary">
                                        Borrow APR
                                    </Typography>
                                    <Typography variant="h6">
                                        {systemParams.borrowRate}%
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="body2" color="text.secondary">
                                        Transfer Fee
                                    </Typography>
                                    <Typography variant="h6">
                                        {systemParams.transferFee}%
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="body2" color="text.secondary">
                                        Withdrawal Fee
                                    </Typography>
                                    <Typography variant="h6">
                                        {fromWei(web3, systemParams.withdrawalFee)}%
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default SystemMetrics;
