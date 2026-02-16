import { Routes, Route } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import ErrorBoundary from './components/user/ErrorBoundary';
import Navbar from './widgets/Navbar';
import Footer from './widgets/Footer';
import Home from './pages/home';
import Dashboard from './pages/user/dashboard';
import Register from './pages/register';
import Savings from './pages/user/savings';
import Lending from './pages/user/lending';
import Vault from './pages/user/vault';
import AdminDashboard from './pages/admin/dashboard';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          bgcolor: 'background.default'
        }}
      >
        <Navbar />
        <Container
          component="main"
          sx={{
            flexGrow: 1,
            py: 4,
            display: 'flex',
            flexDirection: 'column'
          }}
          maxWidth="lg"
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/register" element={<Register />} />
            <Route path="/savings" element={<Savings />} />
            <Route path="/lending" element={<Lending />} />
            <Route path="/vault" element={<Vault />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </Container>
        <Footer />
      </Box>
    </ErrorBoundary>
  );
}

export default App;
