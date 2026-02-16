const contractAddresses = {
    1: { // Mainnet
        vault: process.env.MAINNET_VAULT_ADDRESS,
        token: process.env.MAINNET_TOKEN_ADDRESS,
        bridge: process.env.MAINNET_BRIDGE_ADDRESS
    },
    137: { // Polygon
        vault: process.env.POLYGON_VAULT_ADDRESS,
        token: process.env.POLYGON_TOKEN_ADDRESS,
        bridge: process.env.POLYGON_BRIDGE_ADDRESS
    },
    56: { // BSC
        vault: process.env.BSC_VAULT_ADDRESS,
        token: process.env.BSC_TOKEN_ADDRESS,
        bridge: process.env.BSC_BRIDGE_ADDRESS
    },
    5: { // Goerli
        vault: process.env.GOERLI_VAULT_ADDRESS,
        token: process.env.GOERLI_TOKEN_ADDRESS,
        bridge: process.env.GOERLI_BRIDGE_ADDRESS
    },
    80001: { // Mumbai
        vault: process.env.MUMBAI_VAULT_ADDRESS,
        token: process.env.MUMBAI_TOKEN_ADDRESS,
        bridge: process.env.MUMBAI_BRIDGE_ADDRESS
    }
};

// Helper function to get contract addresses for current network
export const getContractAddresses = (chainId) => {
    return contractAddresses[chainId] || contractAddresses[1]; // Default to mainnet
};

export { contractAddresses };