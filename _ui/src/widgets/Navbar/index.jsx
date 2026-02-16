import { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Button,
  MenuItem,
  Stack,
  Alert,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import UserAccountContext from "../../context/UserAccountContext";
// import {
//   connectWallet,
//   getCurrentWalletConnected
// } from "./../../utils/smart-contract/interact"

const Navbar = () => {
  const [anchorElNav, setAnchorElNav] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { wallet, loading, error, connectWallet, disconnectWallet } = useContext(UserAccountContext);

  const pages = [
    { title: 'Home', path: '/' },
    { title: 'Dashboard', path: '/dashboard', requiresAuth: true },
    { title: 'Savings', path: '/savings', requiresAuth: true },
    { title: 'Lending', path: '/lending', requiresAuth: true },
    { title: 'Vault', path: '/vault', requiresAuth: true },
  ];

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleNavigate = (path) => {
    handleCloseNavMenu();
    navigate(path);
  };

  const formatAddress = (addr) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const filteredPages = pages.filter(page => !page.requiresAuth || wallet);

  return (
    <AppBar position="sticky">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo - Desktop */}
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ mr: 2, display: { xs: 'none', md: 'flex' }, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            NOORIBANK
          </Typography>

          {/* Mobile Menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{ display: { xs: 'block', md: 'none' } }}
            >
              {filteredPages.map((page) => (
                <MenuItem
                  key={page.path}
                  onClick={() => handleNavigate(page.path)}
                  selected={location.pathname === page.path}
                >
                  <Typography textAlign="center">{page.title}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Logo - Mobile */}
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' }, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            NOORIBANK
          </Typography>

          {/* Desktop Menu */}
          <Stack
            direction="row"
            spacing={2}
            sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}
          >
            {filteredPages.map((page) => (
              <Button
                key={page.path}
                onClick={() => handleNavigate(page.path)}
                sx={{
                  color: 'white',
                  display: 'block',
                  backgroundColor: location.pathname === page.path ? 'rgba(255,255,255,0.1)' : 'transparent'
                }}
              >
                {page.title}
              </Button>
            ))}
          </Stack>

          {/* Wallet Section */}
          <Box sx={{ flexGrow: 0 }}>
            {error && (
              <Alert severity="error" sx={{ position: 'absolute', top: '70px', right: '20px' }}>
                {error}
              </Alert>
            )}
            {wallet ? (
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography sx={{ display: { xs: 'none', md: 'block' } }}>
                  {formatAddress(wallet)}
                </Typography>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={disconnectWallet}
                  disabled={loading}
                >
                  {loading ? 'Disconnecting...' : 'Disconnect'}
                </Button>
              </Stack>
            ) : (
              <Button
                variant="contained"
                color="secondary"
                onClick={connectWallet}
                disabled={loading}
              >
                {loading ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
      {error && (
        <Alert severity="error" sx={{ position: 'absolute', top: '70px', right: '20px' }}>
          {error}
        </Alert>
      )}
    </AppBar>
  );
};

export default Navbar;