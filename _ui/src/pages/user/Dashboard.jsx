import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../../context/Web3Context';
import { WalletConnect } from '../../components/user/WalletConnect';
import { VaultInterface } from '../../components/user/VaultInterface';

const Dashboard = () => {
  const { account } = useWeb3();
  const navigate = useNavigate();

  // Redirect to home if not connected
  useEffect(() => {
    if (!account) {
      navigate('/');
    }
  }, [account, navigate]);

  if (!account) {
    return null; // Will redirect
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>NOORI Dashboard</h1>
        <WalletConnect />
      </header>

      <main className="dashboard-content">
        <section className="dashboard-section">
          <h2>Vault</h2>
          <VaultInterface />
        </section>

        {/* Add more sections as needed */}
      </main>
    </div>
  );
};

export default Dashboard;
