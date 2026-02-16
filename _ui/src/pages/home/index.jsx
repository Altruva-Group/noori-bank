import { useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import { useUserAccount } from '../../context/hooks';
import './home.css';

const Home = () => {
    const navigate = useNavigate();
    const { 
        account, 
        isConnected,
        loading, 
        error, 
        connectWallet 
    } = useUserAccount();
    
    // Only navigate after successful connection
    useEffect(() => {
        if (isConnected && account) {
            navigate("/dashboard");
        }
    }, [account, isConnected, navigate]);

    return (
        <Box className="home-container">
            <Box className="hero-section">
                <Typography variant="h1">NOORI BANK</Typography>
                <Typography variant="h2">Welcome to the Future of Digital Banking</Typography>
                
                <Box className="connection-section">
                    <Box className="connection-status">
                        {loading ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <CircularProgress size={24} />
                                <Typography>Connecting to MetaMask...</Typography>
                            </Box>
                        ) : (
                            <>
                                <Button 
                                    variant="contained" 
                                    size="large"
                                    onClick={connectWallet}
                                    disabled={loading || isConnected}
                                >
                                    Connect Wallet
                                </Button>
                                {error && (
                                    <Typography color="error" sx={{ mt: 2 }}>
                                        {error}
                                    </Typography>
                                )}
                            </>
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default Home;