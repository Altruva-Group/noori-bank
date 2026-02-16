import { useState, useEffect } from 'react';
import './RoleManager.css';
import { useUserAccount } from '../../context/hooks';
import web3Service from '../../utils/smart-contract/web3';

const RoleManager = () => {
  const { contracts, account } = useUserAccount();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [targetAddress, setTargetAddress] = useState('');

  // Define common roles
  const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
  const OPERATOR_ROLE = web3Service.web3.utils.keccak256('OPERATOR_ROLE');
  const MANAGER_ROLE = web3Service.web3.utils.keccak256('MANAGER_ROLE');

  const PREDEFINED_ROLES = [
    { id: DEFAULT_ADMIN_ROLE, name: 'Admin', description: 'Full system access' },
    { id: OPERATOR_ROLE, name: 'Operator', description: 'Can manage system parameters' },
    { id: MANAGER_ROLE, name: 'Manager', description: 'Can manage user roles and access' }
  ];

  useEffect(() => {
    loadRoles();
  }, [contract]);

  const loadRoles = async () => {
    if (!contracts.vault) return;
    
    try {
      setLoading(true);
      // Load active roles and their members
      const activeRoles = await Promise.all(
        PREDEFINED_ROLES.map(async (role) => {
          const members = await contracts.vault.methods.getRoleMembers(role.id).call();
          return {
            ...role,
            members: members
          };
        })
      );
      setRoles(activeRoles);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const grantRole = async () => {
    if (!contracts.vault || !account || !selectedRole || !targetAddress) return;
    try {
      setLoading(true);
      setError(null);

      // Check if address is valid
      if (!web3Service.web3.utils.isAddress(targetAddress)) {
        throw new Error('Invalid Ethereum address');
      }

      // Check if the caller has admin role for the selected role
      const adminRole = await contracts.vault.methods.getRoleAdmin(selectedRole).call();
      const hasAdminRole = await contracts.vault.methods.hasRole(adminRole, account).call();
      if (!hasAdminRole) {
        throw new Error('You do not have permission to grant this role');
      }

      await contracts.vault.methods.grantRole(selectedRole, targetAddress).send({ from: account });
      await loadRoles();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const revokeRole = async () => {
    if (!contracts.vault || !account || !selectedRole || !targetAddress) return;
    try {
      setLoading(true);
      setError(null);

      // Check if address is valid
      if (!web3Service.web3.utils.isAddress(targetAddress)) {
        throw new Error('Invalid Ethereum address');
      }

      // Check if the caller has admin role for the selected role
      const adminRole = await contracts.vault.methods.getRoleAdmin(selectedRole).call();
      const hasAdminRole = await contracts.vault.methods.hasRole(adminRole, account).call();
      if (!hasAdminRole) {
        throw new Error('You do not have permission to revoke this role');
      }

      await contracts.vault.methods.revokeRole(selectedRole, targetAddress).send({ from: account });
      await loadRoles();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="role-manager">
      <h2>Role Manager</h2>
      
      {error && <div className="error-message">{error}</div>}

      <div className="create-role-section">
        <h3>Create New Role</h3>
        <input
          type="text"
          placeholder="Role Name"
          value={newRoleName}
          onChange={(e) => setNewRoleName(e.target.value)}
        />
        <button onClick={createRole} disabled={loading || !newRoleName}>
          Create Role
        </button>
      </div>

      <div className="manage-roles-section">
        <h3>Manage Roles</h3>
        <select 
          value={selectedRole || ''}
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          <option value="">Select Role</option>
          {roles.map(role => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Target Address"
          value={targetAddress}
          onChange={(e) => setTargetAddress(e.target.value)}
        />

        <div className="role-actions">
          <button 
            onClick={grantRole} 
            disabled={loading || !selectedRole || !targetAddress}
          >
            Grant Role
          </button>
          <button 
            onClick={revokeRole}
            disabled={loading || !selectedRole || !targetAddress}
          >
            Revoke Role
          </button>
        </div>
      </div>

      {loading && <div className="loading">Loading...</div>}
    </div>
  );
};

export default RoleManager;
