import React, { useContext, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { vaultRegister } from '../../utils/smart-contract/blockchain';
import UserAccountContext from '../../context/UserAccountContext';
import './register.css';

const Register = () => {
    const navigate = useNavigate();
    const { wallet, setAccount } = useContext(UserAccountContext);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [masterPassword, setMasterPassword] = useState("");
    const [recoveryKey, setRecoveryKey] = useState("");

    const registerUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await vaultRegister(wallet, masterPassword, recoveryKey);
    
            if (response) {
                localStorage.setItem("accountId", response.id);
                setAccount(response);
                navigate('/dashboard');
            } else {
                setError("Registration failed. Please try again.");
            }
        } catch (err) {
            console.error("Error registering new user:", err);
            setError(err.message || "Failed to register. Please try again.");
            setAccount(null);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="register-container">
            <div className="register-card">
                <h1>Create Your Account</h1>
                
                {error && (
                    <div className="error-message">{error}</div>
                )}

                <form onSubmit={registerUser} className="register-form">
                    <div className="form-group">
                        <label htmlFor="masterPassword">Master Password</label>
                        <input
                            type="password"
                            id="masterPassword"
                            value={masterPassword}
                            onChange={(e) => setMasterPassword(e.target.value)}
                            placeholder="Enter your master password"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="recoveryKey">Recovery Key</label>
                        <input
                            type="password"
                            id="recoveryKey"
                            value={recoveryKey}
                            onChange={(e) => setRecoveryKey(e.target.value)}
                            placeholder="Enter your recovery key"
                            required
                            disabled={loading}
                        />
                        <small className="helper-text">
                            Store this key safely. You&apos;ll need it to recover your account if you forget your master password.
                        </small>
                    </div>

                    <button 
                        type="submit"
                        className={`register-button ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Register;