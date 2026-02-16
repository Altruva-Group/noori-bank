import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { networks } from '../../config/networks';

let web3Modal;
let provider;
let chainId;

export const initializeWeb3 = async () => {
    if (!web3Modal) {
        web3Modal = new Web3Modal({
            network: networks.default,
            cacheProvider: true,
            providerOptions: {
                walletconnect: {
                    package: WalletConnectProvider,
                    options: {
                        rpc: networks.rpcUrls
                    }
                }
            }
        });
    }
    return web3Modal;
};

export const connectWeb3 = async () => {
    try {
        provider = await web3Modal.connect();
        const ethersProvider = new ethers.providers.Web3Provider(provider);
        const network = await ethersProvider.getNetwork();
        chainId = network.chainId;

        provider.on('accountsChanged', async (accounts) => {
            if (accounts.length === 0) {
                await disconnectWeb3();
            }
            window.location.reload();
        });

        provider.on('chainChanged', () => {
            window.location.reload();
        });

        provider.on('disconnect', async () => {
            await disconnectWeb3();
            window.location.reload();
        });

        return ethersProvider;
    } catch (error) {
        console.error('Error connecting to web3:', error);
        throw error;
    }
};

export const disconnectWeb3 = async () => {
    if (provider?.disconnect) {
        await provider.disconnect();
    }
    await web3Modal.clearCachedProvider();
    provider = null;
};

export const switchNetwork = async (networkId) => {
    if (!provider) throw new Error('No Web3 Provider');
    
    try {
        await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: ethers.utils.hexValue(networkId) }],
        });
    } catch (error) {
        if (error.code === 4902) {
            await addNetwork(networkId);
        } else {
            throw error;
        }
    }
};

export const addNetwork = async (networkId) => {
    const network = networks[networkId];
    if (!network) throw new Error('Network not supported');

    await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
            {
                chainId: ethers.utils.hexValue(networkId),
                chainName: network.name,
                nativeCurrency: network.nativeCurrency,
                rpcUrls: [network.rpcUrl],
                blockExplorerUrls: [network.blockExplorer]
            }
        ]
    });
};

export const getChainId = () => chainId;
export const getProvider = () => provider;
export const getSigner = async () => {
    const ethersProvider = new ethers.providers.Web3Provider(provider);
    return ethersProvider.getSigner();
};