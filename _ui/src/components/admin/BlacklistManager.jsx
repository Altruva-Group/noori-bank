import React, { useState, useEffect } from 'react';
import './BlacklistManager.css';
import { useUserAccount } from '../../context/hooks';

const BlacklistManager = () => {
  const { contracts, account } = useUserAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [blacklistedAddresses, setBlacklistedAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    loadBlacklist();
  }, [contract]);

  const loadBlacklist = async () => {
    if (!contracts.vault) return;
    try {
      setLoading(true);
      
      // Get all blacklisted addresses from the contract
      const addresses = await contracts.vault.methods.getBlacklistedAddresses().call();
      
      // Get details for each address
      const blacklist = await Promise.all(addresses.map(async (address) => {
        const details = await contracts.vault.methods.getBlacklistDetails(address).call();
        return {
          address,
          reason: details.reason || 'No reason provided',
          date: new Date(details.timestamp * 1000).toLocaleDateString()
        };
      }));
      
      setBlacklistedAddresses(blacklist);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addToBlacklist = async () => {
    if (!contracts.vault || !account || !newAddress) return;
    try {
      setLoading(true);
      await contracts.vault.methods.addToBlacklist(newAddress, "Manually blacklisted").send({ from: account });
      await loadBlacklist();
      setNewAddress('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeFromBlacklist = async (address) => {
    if (!contracts.vault || !account) return;
    try {
      setLoading(true);
      await contracts.vault.methods.removeFromBlacklist(address).send({ from: account });
      await loadBlacklist();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportBlacklist = () => {
    const data = JSON.stringify(blacklistedAddresses, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'blacklist.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setFile(file);
  };

  const importBlacklist = async () => {
    if (!file) return;
    try {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const addresses = JSON.parse(e.target.result);
          // Here you would normally validate the addresses and add them to the contract
          // For now just update the state
          setBlacklistedAddresses(addresses);
          setFile(null);
        } catch (err) {
          setError('Invalid file format');
        } finally {
          setLoading(false);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const filteredAddresses = blacklistedAddresses.filter(item =>
    item.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="blacklist-manager">
      <h2>Blacklist Manager</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="add-address-section">
        <h3>Add to Blacklist</h3>
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter address"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
          />
          <button 
            onClick={addToBlacklist}
            disabled={loading || !newAddress}
          >
            Add to Blacklist
          </button>
        </div>
      </div>

      <div className="import-export-section">
        <div className="import-group">
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            id="file-upload"
          />
          <button 
            onClick={importBlacklist}
            disabled={loading || !file}
          >
            Import Blacklist
          </button>
        </div>
        <button 
          onClick={exportBlacklist}
          disabled={loading || blacklistedAddresses.length === 0}
        >
          Export Blacklist
        </button>
      </div>

      <div className="blacklist-section">
        <h3>Blacklisted Addresses</h3>
        <input
          type="text"
          placeholder="Search addresses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <div className="blacklist-table">
          <div className="table-header">
            <div className="col">Address</div>
            <div className="col">Reason</div>
            <div className="col">Date</div>
            <div className="col">Actions</div>
          </div>
          {filteredAddresses.map((item, index) => (
            <div key={index} className="table-row">
              <div className="col">{item.address}</div>
              <div className="col">{item.reason}</div>
              <div className="col">{item.date}</div>
              <div className="col">
                <button
                  onClick={() => removeFromBlacklist(item.address)}
                  className="remove-button"
                  disabled={loading}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {loading && <div className="loading">Loading...</div>}
    </div>
  );
};

export default BlacklistManager;
