const networks = {
    default: 'mainnet',
    1: {
        name: 'Ethereum Mainnet',
        rpcUrl: process.env.MAINNET_RPC_URL,
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
        },
        blockExplorer: 'https://etherscan.io'
    },
    137: {
        name: 'Polygon Mainnet',
        rpcUrl: process.env.POLYGON_RPC_URL,
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18
        },
        blockExplorer: 'https://polygonscan.com'
    },
    56: {
        name: 'BNB Smart Chain',
        rpcUrl: process.env.BSC_RPC_URL,
        nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18
        },
        blockExplorer: 'https://bscscan.com'
    },
    // Add testnet configurations
    5: {
        name: 'Goerli Testnet',
        rpcUrl: process.env.GOERLI_RPC_URL,
        nativeCurrency: {
            name: 'Goerli ETH',
            symbol: 'ETH',
            decimals: 18
        },
        blockExplorer: 'https://goerli.etherscan.io'
    },
    80001: {
        name: 'Polygon Mumbai',
        rpcUrl: process.env.MUMBAI_RPC_URL,
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18
        },
        blockExplorer: 'https://mumbai.polygonscan.com'
    }
};

// RPC URLs for WalletConnect
const rpcUrls = {
    1: networks[1].rpcUrl,
    137: networks[137].rpcUrl,
    56: networks[56].rpcUrl,
    5: networks[5].rpcUrl,
    80001: networks[80001].rpcUrl
};

export { networks, rpcUrls };