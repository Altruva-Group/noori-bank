import { createContext } from "react";

const UserAccountContext = createContext({
    account: null,
    isConnected: false,
    chainId: null,
    loading: false,
    error: null,
    tokenBalance: '0',
    vaultBalance: '0',
    systemParams: {
        depositRate: '0',
        borrowRate: '0',
        transferFee: '0',
        withdrawalFee: '0',
        minCollateralRatio: '0'
    },
    contracts: {
        token: null,
        vault: null
    },
    web3: null,
    connectWallet: () => {},
    disconnectWallet: () => {}
});

export default UserAccountContext;
