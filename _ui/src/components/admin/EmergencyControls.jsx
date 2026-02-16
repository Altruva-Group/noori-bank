import { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Grid,
    Switch,
    FormControlLabel,
} from '@mui/material';
import { 
    Warning as WarningIcon,
    Lock as LockIcon,
    LockOpen as LockOpenIcon,
    PriorityHigh as PriorityHighIcon,
} from '@mui/icons-material';
import { useUserAccount } from '../../../context/hooks';

const EmergencyControls = () => {
    const { contracts } = useUserAccount();
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedAction, setSelectedAction] = useState(null);
    const [systemStatus, setSystemStatus] = useState({
        isPaused: false,
        isLendingPaused: false,
        isWithdrawalPaused: false,
        isTransferPaused: false
    });

    // Check system status on component mount
    useEffect(() => {
        checkSystemStatus();
    }, []);

    // Fetch current system status
    const checkSystemStatus = async () => {
        if (!contracts.vault) return;

        try {
            const [
                isPaused,
                isLendingPaused,
                isWithdrawalPaused,
                isTransferPaused
            ] = await Promise.all([
                contracts.vault.methods.paused().call(),
                contracts.vault.methods.lendingPaused().call(),
                contracts.vault.methods.withdrawalPaused().call(),
                contracts.vault.methods.transferPaused().call(),
            ]);

            setSystemStatus({
                isPaused,
                isLendingPaused,
                isWithdrawalPaused,
                isTransferPaused
            });
        } catch (error) {
            console.error('Error checking system status:', error);
            setError('Failed to fetch system status');
        }
    };

    // Handle emergency actions
    const handleEmergencyAction = async () => {
        if (!selectedAction) return;

        try {
            setLoading(true);
            setError('');

            let method;
            switch (selectedAction) {
                case 'pauseSystem':
                    method = contracts.vault.methods.pause();
                    break;
                case 'unpauseSystem':
                    method = contracts.vault.methods.unpause();
                    break;
                case 'pauseLending':
                    method = contracts.vault.methods.pauseLending();
                    break;
                case 'unpauseLending':
                    method = contracts.vault.methods.unpauseLending();
                    break;
                case 'pauseWithdrawals':
                    method = contracts.vault.methods.pauseWithdrawals();
                    break;
                case 'unpauseWithdrawals':
                    method = contracts.vault.methods.unpauseWithdrawals();
                    break;
                case 'pauseTransfers':
                    method = contracts.vault.methods.pauseTransfers();
                    break;
                case 'unpauseTransfers':
                    method = contracts.vault.methods.unpauseTransfers();
                    break;
                default:
                    throw new Error('Invalid action');
            }

            await method.send({ from: web3.eth.defaultAccount });
            await checkSystemStatus();
            setDialogOpen(false);
        } catch (error) {
            console.error('Error executing emergency action:', error);
            setError('Failed to execute emergency action');
        } finally {
            setLoading(false);
        }
    };

    const openConfirmDialog = (action) => {
        setSelectedAction(action);
        setDialogOpen(true);
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Emergency Controls
            </Typography>

            <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                    Warning: High-Risk Controls
                </Typography>
                These controls should only be used in emergency situations. 
                All actions are logged and irreversible.
            </Alert>

            <Grid container spacing={3}>
                {/* System-wide Controls */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                System-wide Controls
                            </Typography>
                            <Stack spacing={2}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={systemStatus.isPaused}
                                            onChange={() => openConfirmDialog(
                                                systemStatus.isPaused ? 'unpauseSystem' : 'pauseSystem'
                                            )}
                                            color="error"
                                        />
                                    }
                                    label={
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            {systemStatus.isPaused ? <LockIcon /> : <LockOpenIcon />}
                                            <Typography>
                                                {systemStatus.isPaused ? 'System Paused' : 'System Active'}
                                            </Typography>
                                        </Stack>
                                    }
                                />
                                <Typography variant="caption" color="text.secondary">
                                    Pauses all contract functionality except emergency functions
                                </Typography>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Feature Controls */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Feature Controls
                            </Typography>
                            <Stack spacing={2}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={systemStatus.isLendingPaused}
                                            onChange={() => openConfirmDialog(
                                                systemStatus.isLendingPaused ? 'unpauseLending' : 'pauseLending'
                                            )}
                                        />
                                    }
                                    label="Lending"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={systemStatus.isWithdrawalPaused}
                                            onChange={() => openConfirmDialog(
                                                systemStatus.isWithdrawalPaused ? 'unpauseWithdrawals' : 'pauseWithdrawals'
                                            )}
                                        />
                                    }
                                    label="Withdrawals"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={systemStatus.isTransferPaused}
                                            onChange={() => openConfirmDialog(
                                                systemStatus.isTransferPaused ? 'unpauseTransfers' : 'pauseTransfers'
                                            )}
                                        />
                                    }
                                    label="Transfers"
                                />
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Confirmation Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="warning" />
                    Confirm Emergency Action
                </DialogTitle>
                <DialogContent>
                    <Typography paragraph>
                        Are you sure you want to {selectedAction}? This action will affect all users.
                    </Typography>
                    <Alert severity="warning">
                        This is a high-risk action that should only be used in emergencies.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleEmergencyAction}
                        color="error"
                        variant="contained"
                        disabled={loading}
                        startIcon={<PriorityHighIcon />}
                    >
                        Confirm Action
                    </Button>
                </DialogActions>
            </Dialog>

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}
        </Box>
    );
};

export default EmergencyControls;
