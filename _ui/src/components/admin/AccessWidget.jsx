import React, { useState, useEffect, useCallback } from 'react';
import './AccessWidget.css';
import { useUserAccount } from '../../context/hooks';
import web3Service from '../../utils/smart-contract/web3';

const DEFAULT_ADMIN_ROLE = '0x00';
const OPERATOR_ROLE = web3Service.web3?.utils.keccak256('OPERATOR_ROLE');
const MANAGER_ROLE = web3Service.web3?.utils.keccak256('MANAGER_ROLE');

const AccessWidget = () => {
  const { account, tokenContractRef: contract } = useUserAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [targetAccount, setTargetAccount] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const ROLES = [
    { id: DEFAULT_ADMIN_ROLE, name: 'Admin', description: 'Full system access' },
    { id: OPERATOR_ROLE, name: 'Operator', description: 'Can manage system parameters' },
    { id: MANAGER_ROLE, name: 'Manager', description: 'Can manage user roles and access' }
  ];

  const loadUserRoles = useCallback(async () => {
    if (!contract || !account) return;
    try {
      setLoading(true);
      setError(null);

      const roles = await Promise.all(
        ROLES.map(async (role) => {
          const hasRole = await contract.methods.hasRole(role.id, account).call();
          return hasRole ? { ...role, active: true } : null;
        })
      );

      setUserRoles(roles.filter(role => role !== null));
    } catch (err) {
      console.error('Error loading user roles:', err);
      setError('Failed to load user roles. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [contract, account, ROLES]);

  const loadAvailableRoles = useCallback(async () => {
    if (!contract || !account) return;
    try {
      const roles = await Promise.all(
        ROLES.map(async (role) => {
          const canGrant = await contract.methods.hasRole(
            await contract.methods.getRoleAdmin(role.id).call(),
            account
          ).call();
          return canGrant ? role : null;
        })
      );

      setAvailableRoles(roles.filter(role => role !== null));
    } catch (err) {
      console.error('Error loading available roles:', err);
      setError('Failed to load available roles. Please try again.');
    }
  }, [contract, account, ROLES]);

  useEffect(() => {
    loadUserRoles();
    loadAvailableRoles();
  }, [loadUserRoles, loadAvailableRoles]);

  const handleRoleAction = async (action, role, account) => {
    if (!contract) return;
    
    try {
      setLoading(true);
      setError(null);

      let tx;
      if (action === 'grant') {
        tx = await contract.methods.grantRole(role.id, account).send({ from: account });
      } else if (action === 'revoke') {
        tx = await contract.methods.revokeRole(role.id, account).send({ from: account });
      } else if (action === 'renounce') {
        tx = await contract.methods.renounceRole(role.id, account).send({ from: account });
      }

      await loadUserRoles();
      await loadAvailableRoles();
      setShowConfirm(false);
      setPendingAction(null);

      // Show success message
      console.log(`Role ${action} successful. Transaction: ${tx.transactionHash}`);
    } catch (err) {
      console.error(`Error ${action}ing role:`, err);
      setError(`Failed to ${action} role. ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const validateAddress = (address) => {
    return web3.utils.isAddress(address);
  };

  const initiateAction = (action, role, targetAcct) => {
    if (action !== 'renounce' && !validateAddress(targetAcct)) {
      setError('Please enter a valid Ethereum address');
      return;
    }

    setPendingAction({ action, role, targetAcct });
    setShowConfirm(true);
  };

  return (
    <div className="access-widget">
      <h2>Access Control</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="access-info">
        <div className="roles-section">
          <h3>Your Roles</h3>
          {loading ? (
            <div className="loading">Loading roles...</div>
          ) : (
            <div className="roles-list">
              {userRoles.length > 0 ? (
                userRoles.map(role => (
                  <div key={role.id} className="role-item">
                    <span className="role-name">{role.name}</span>
                    <span className="role-description">{role.description}</span>
                    <button
                      onClick={() => initiateAction('renounce', role, account)}
                      className="danger-button"
                    >
                      Renounce Role
                    </button>
                  </div>
                ))
              ) : (
                <p>You have no active roles.</p>
              )}
            </div>
          )}
        </div>

        {availableRoles.length > 0 && (
          <div className="role-management">
            <h3>Role Management</h3>
            <div className="role-form">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="">Select Role</option>
                {availableRoles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Target Address"
                value={targetAccount}
                onChange={(e) => setTargetAccount(e.target.value)}
              />
              <button
                onClick={() => initiateAction('grant', 
                  ROLES.find(r => r.id === selectedRole),
                  targetAccount
                )}
                disabled={!selectedRole || !targetAccount || loading}
                className="primary-button"
              >
                Grant Role
              </button>
              <button
                onClick={() => initiateAction('revoke',
                  ROLES.find(r => r.id === selectedRole),
                  targetAccount
                )}
                disabled={!selectedRole || !targetAccount || loading}
                className="danger-button"
              >
                Revoke Role
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && pendingAction && (
        <div className="confirmation-dialog">
          <div className="dialog-content">
            <h4>Confirm Action</h4>
            <p>Are you sure you want to {pendingAction.action} the {pendingAction.role.name} role
              {pendingAction.action !== 'renounce' ? ` for ${pendingAction.targetAcct}` : ''}?
            </p>
            {pendingAction.action === 'revoke' && (
              <p className="warning">
                This action will remove all permissions associated with this role!
              </p>
            )}
            <div className="dialog-buttons">
              <button onClick={() => setShowConfirm(false)} disabled={loading}>
                Cancel
              </button>
              <button 
                onClick={() => handleRoleAction(
                  pendingAction.action,
                  pendingAction.role,
                  pendingAction.targetAcct
                )}
                disabled={loading}
                className="confirm-button"
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessWidget;
