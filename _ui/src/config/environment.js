const env = {
    APP_ENV: process.env.REACT_APP_ENV || 'development',
    // Network RPCs
    MAINNET_RPC_URL: process.env.REACT_APP_MAINNET_RPC_URL,
    POLYGON_RPC_URL: process.env.REACT_APP_POLYGON_RPC_URL,
    BSC_RPC_URL: process.env.REACT_APP_BSC_RPC_URL,
    GOERLI_RPC_URL: process.env.REACT_APP_GOERLI_RPC_URL,
    MUMBAI_RPC_URL: process.env.REACT_APP_MUMBAI_RPC_URL,
    
    // Contract Addresses
    VAULT_ADDRESS: process.env.REACT_APP_VAULT_ADDRESS,
    TOKEN_ADDRESS: process.env.REACT_APP_TOKEN_ADDRESS,
    BRIDGE_ADDRESS: process.env.REACT_APP_BRIDGE_ADDRESS,
    
    // API Configuration
    API_URL: process.env.REACT_APP_API_URL,
    API_KEY: process.env.REACT_APP_API_KEY,
    
    // Feature Flags
    ENABLE_TESTNET: process.env.REACT_APP_ENABLE_TESTNET === 'true',
    ENABLE_BRIDGE: process.env.REACT_APP_ENABLE_BRIDGE === 'true',
    
    // App Configuration
    DEFAULT_NETWORK: process.env.REACT_APP_DEFAULT_NETWORK || '1',
    GAS_LIMIT_BUFFER: process.env.REACT_APP_GAS_LIMIT_BUFFER || '1.2',
    MAX_APPROVAL_AMOUNT: process.env.REACT_APP_MAX_APPROVAL_AMOUNT || '115792089237316195423570985008687907853269984665640564039457584007913129639935', // uint256 max
    
    isProduction: () => env.APP_ENV === 'production',
    isDevelopment: () => env.APP_ENV === 'development',
    isTestnet: () => env.ENABLE_TESTNET === 'true'
};

export default env;