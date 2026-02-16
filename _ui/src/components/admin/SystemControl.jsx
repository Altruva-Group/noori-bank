import { useState, useEffect, useCallback } from 'react';
import './SystemControl.css';
import { useUserAccount } from '../../context/hooks';
import web3Service from '../../utils/smart-contract/web3';

const SystemControl = () => {
  const { contracts, account } = useUserAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [transactionHash, setTransactionHash] = useState(null);
  const [systemParams, setSystemParams] = useState({
    interestRate: '',
    minimumDeposit: '',
    maximumDeposit: '',
    systemPaused: false,
    collateralRatio: '',
    liquidationThreshold: ''
  });

  const loadSystemParams = useCallback(async () => {
    if (!contracts.vault) return;
    try {
      setLoading(true);
      setError(null);
      
      const [
        interestRate,
        minDeposit,
        maxDeposit,
        isPaused,
        collateralRatio,
        liquidationThreshold
      ] = await Promise.all([
        contracts.vault.methods.getInterestRate().call(),
        contracts.vault.methods.getMinimumDeposit().call(),
        contracts.vault.methods.getMaximumDeposit().call(),
        contracts.vault.methods.paused().call(),
        contracts.vault.methods.getCollateralRatio().call(),
        contracts.vault.methods.getLiquidationThreshold().call()
      ]);

      setSystemParams({
        interestRate: web3Service.web3.utils.fromWei(interestRate, 'ether'),
        minimumDeposit: web3Service.web3.utils.fromWei(minDeposit, 'ether'),
        maximumDeposit: web3Service.web3.utils.fromWei(maxDeposit, 'ether'),
        systemPaused: isPaused,
        collateralRatio: web3Service.web3.utils.fromWei(collateralRatio, 'ether'),
        liquidationThreshold: web3Service.web3.utils.fromWei(liquidationThreshold, 'ether')
      });
    } catch (err) {
      console.error('Error loading system parameters:', err);
      setError('Failed to load system parameters. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [contract]);

  useEffect(() => {
    loadSystemParams();
  }, [loadSystemParams]);

  const validateParams = () => {
    const errors = [];
    const params = systemParams;
    
    if (parseFloat(params.interestRate) < 0 || parseFloat(params.interestRate) > 100) {
      errors.push('Interest rate must be between 0 and 100%');
    }
    
    if (parseFloat(params.minimumDeposit) < 0) {
      errors.push('Minimum deposit cannot be negative');
    }
    
    if (parseFloat(params.maximumDeposit) <= parseFloat(params.minimumDeposit)) {
      errors.push('Maximum deposit must be greater than minimum deposit');
    }

    if (parseFloat(params.collateralRatio) < 100) {
      errors.push('Collateral ratio must be at least 100%');
    }

    if (parseFloat(params.liquidationThreshold) <= parseFloat(params.collateralRatio)) {
      errors.push('Liquidation threshold must be greater than collateral ratio');
    }

    return errors;
  };

  const handleConfirmation = async () => {
    if (!pendingAction) return;
    
    try {
      setLoading(true);
      setError(null);
      setShowConfirm(false);

      let tx;
      const params = systemParams;
      
      if (pendingAction.type === 'UPDATE_INTEREST') {
        const interestRateWei = web3Service.web3.utils.toWei(params.interestRate.toString(), 'ether');
        tx = await contracts.vault.methods.setInterestRate(interestRateWei)
          .send({ from: account });
      } else if (pendingAction.type === 'UPDATE_LIMITS') {
        const minDepositWei = web3Service.web3.utils.toWei(params.minimumDeposit.toString(), 'ether');
        const maxDepositWei = web3Service.web3.utils.toWei(params.maximumDeposit.toString(), 'ether');
        tx = await contracts.vault.methods.setDepositLimits(minDepositWei, maxDepositWei)
          .send({ from: account });
      } else if (pendingAction.type === 'UPDATE_COLLATERAL') {
        const collateralRatioWei = web3Service.web3.utils.toWei(params.collateralRatio.toString(), 'ether');
        const liquidationThresholdWei = web3Service.web3.utils.toWei(params.liquidationThreshold.toString(), 'ether');
        tx = await contracts.vault.methods.setCollateralParameters(collateralRatioWei, liquidationThresholdWei)
          .send({ from: account });
      } else if (pendingAction.type === 'TOGGLE_PAUSE') {
        const method = params.systemPaused ? 'unpause' : 'pause';
        tx = await contracts.vault.methods[method]().send({ from: account });
      }

      setTransactionHash(tx.transactionHash);
      await loadSystemParams();
      
    } catch (err) {
      console.error('Transaction failed:', err);
      setError(err.message || 'Transaction failed. Please try again.');
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  const initiateAction = (actionType) => {
    const errors = validateParams();
    if (errors.length > 0) {
      setError(errors.join('\n'));
      return;
    }

    setPendingAction({ type: actionType });
    setShowConfirm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSystemParams(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null); // Clear any previous errors when input changes
  };

  return (
    <div className="system-control">
      <h2>System Control Panel</h2>
      
      {error && <div className="error-message">{error}</div>}

      <div className="control-section">
        <h3>Interest Rate Control</h3>
        <div className="input-group">
          <label>Interest Rate (%)</label>
          <input
            type="number"
            name="interestRate"
            value={systemParams.interestRate}
            onChange={handleInputChange}
            min="0"
            max="100"
          />
          <button 
            onClick={() => initiateAction('UPDATE_INTEREST')}
            disabled={loading}
            className="primary-button"
          >
            {loading ? 'Processing...' : 'Update Interest Rate'}
          </button>
        </div>
      </div>

      <div className="control-section">
        <h3>Deposit Limits</h3>
        <div className="input-group">
          <label>Minimum Deposit</label>
          <input
            type="number"
            name="minimumDeposit"
            value={systemParams.minimumDeposit}
            onChange={handleInputChange}
            min="0"
          />
        </div>
        <div className="input-group">
          <label>Maximum Deposit</label>
          <input
            type="number"
            name="maximumDeposit"
            value={systemParams.maximumDeposit}
            onChange={handleInputChange}
            min="0"
          />
        </div>
        <button 
          onClick={() => initiateAction('UPDATE_LIMITS')}
          disabled={loading}
        >
          Update Deposit Limits
        </button>
      </div>

      <div className="control-section">
        <h3>System Status</h3>
        <div className="status-control">
          <span className={`status-indicator ${systemParams.systemPaused ? 'paused' : 'active'}`}>
            System is {systemParams.systemPaused ? 'Paused' : 'Active'}
          </span>
          <button 
            onClick={() => initiateAction('TOGGLE_PAUSE')}
            className={systemParams.systemPaused ? 'unpause' : 'pause'}
            disabled={loading}
          >
            {systemParams.systemPaused ? 'Unpause System' : 'Pause System'}
          </button>
        </div>
      </div>

      {loading && <div className="loading">Loading...</div>}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="confirmation-dialog">
          <div className="dialog-content">
            <h4>Confirm Action</h4>
            <p>Are you sure you want to perform this action?</p>
            {pendingAction?.type === 'TOGGLE_PAUSE' && (
              <p className="warning">
                {systemParams.systemPaused ? 
                  'This will enable all system operations.' :
                  'This will disable all system operations!'}
              </p>
            )}
            <div className="dialog-buttons">
              <button onClick={() => setShowConfirm(false)} disabled={loading}>
                Cancel
              </button>
              <button 
                onClick={handleConfirmation}
                disabled={loading}
                className="confirm-button"
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Success Message */}
      {transactionHash && (
        <div className="transaction-success">
          <p>Transaction successful!</p>
          <a 
            href={`https://etherscan.io/tx/${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Etherscan
          </a>
        </div>
      )}
    </div>
  );
};

export default SystemControl;
