import { render, screen, fireEvent } from '@testing-library/react';
import { AdminProvider } from '../context/AdminContext';
import SystemControl from '../components/admin/SystemControl';

// Mock admin context
jest.mock('../context/AdminContext', () => ({
  useAdminContext: () => ({
    isAdmin: true,
    systemPaused: false,
    pauseSystem: jest.fn(),
    resumeSystem: jest.fn(),
    updateFees: jest.fn()
  })
}));

describe('SystemControl Component', () => {
  beforeEach(() => {
    render(
      <AdminProvider>
        <SystemControl />
      </AdminProvider>
    );
  });

  it('should display system status', () => {
    expect(screen.getByText(/System Status: Active/i)).toBeInTheDocument();
  });

  it('should handle system pause', () => {
    const pauseButton = screen.getByTestId('pause-system');
    fireEvent.click(pauseButton);
    expect(screen.getByText(/Pausing system/i)).toBeInTheDocument();
  });

  it('should handle fee updates', () => {
    const feeInput = screen.getByTestId('withdrawal-fee-input');
    const updateButton = screen.getByTestId('update-fees');

    fireEvent.change(feeInput, { target: { value: '0.6' } });
    fireEvent.click(updateButton);

    expect(screen.getByText(/Updating fees/i)).toBeInTheDocument();
  });

  it('should display current fee structure', () => {
    expect(screen.getByText(/Withdrawal Fee: 0.5%/i)).toBeInTheDocument();
    expect(screen.getByText(/Transfer Fee: 0.1%/i)).toBeInTheDocument();
  });

  it('should require admin confirmation for critical actions', () => {
    const criticalButton = screen.getByTestId('critical-action');
    fireEvent.click(criticalButton);
    
    expect(screen.getByText(/Confirm action/i)).toBeInTheDocument();
    expect(screen.getByText(/This action cannot be undone/i)).toBeInTheDocument();
  });
});