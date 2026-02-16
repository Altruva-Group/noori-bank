import { render, screen, fireEvent } from '@testing-library/react';
import { Web3Provider } from '../context/Web3Context';
import VaultInterface from '../components/user/VaultInterface';
import { ethers } from 'ethers';

// Mock web3 context
jest.mock('../context/Web3Context', () => ({
  useWeb3Context: () => ({
    account: '0x1234...5678',
    connected: true,
    chainId: 1,
    provider: new ethers.providers.JsonRpcProvider(),
    connect: jest.fn(),
    disconnect: jest.fn()
  })
}));

describe('VaultInterface Component', () => {
  beforeEach(() => {
    render(
      <Web3Provider>
        <VaultInterface />
      </Web3Provider>
    );
  });

  it('should display account balance', async () => {
    const balanceElement = await screen.findByTestId('account-balance');
    expect(balanceElement).toBeInTheDocument();
  });

  it('should handle deposit action', async () => {
    const depositInput = screen.getByTestId('deposit-amount');
    const depositButton = screen.getByTestId('deposit-button');

    fireEvent.change(depositInput, { target: { value: '100' } });
    fireEvent.click(depositButton);

    // Verify deposit transaction initiated
    expect(await screen.findByText(/Transaction initiated/i)).toBeInTheDocument();
  });

  it('should handle withdrawal action', async () => {
    const withdrawInput = screen.getByTestId('withdraw-amount');
    const withdrawButton = screen.getByTestId('withdraw-button');

    fireEvent.change(withdrawInput, { target: { value: '50' } });
    fireEvent.click(withdrawButton);

    // Verify withdrawal transaction initiated
    expect(await screen.findByText(/Transaction initiated/i)).toBeInTheDocument();
  });

  it('should display transaction history', async () => {
    const historySection = await screen.findByTestId('transaction-history');
    expect(historySection).toBeInTheDocument();
  });

  it('should show correct fees for transactions', async () => {
    const feeInfo = await screen.findByTestId('fee-info');
    expect(feeInfo).toContainHTML('0.5%'); // Withdrawal fee
    expect(feeInfo).toContainHTML('0.1%'); // Transfer fee
  });
});