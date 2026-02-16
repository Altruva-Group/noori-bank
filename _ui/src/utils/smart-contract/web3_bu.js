import Web3 from 'web3';

class Web3Service {
    constructor() {
        this._web3 = null;
        this._account = null;
        this._chainId = null;
        this.eventHandlers = {
            accountsChanged: [],
            chainChanged: [],
            disconnect: []
        };
        this.handleAccountsChanged = this.handleAccountsChanged.bind(this);
        this.handleChainChanged = this.handleChainChanged.bind(this);
        this.handleDisconnect = this.handleDisconnect.bind(this);
    }

    get web3() {
        return this._web3;
    }

    get account() {
        return this._account;
    }

    get chainId() {
        return this._chainId;
    }

    async ensureWalletAvailable() {
        if (typeof window.ethereum === 'undefined') {
            throw new Error('Please install MetaMask to use this application');
        }
    }

    handleAccountsChanged(accounts) {
        const newAccount = accounts[0] || null;
        if (this._account !== newAccount) {
            this._account = newAccount;
            this.eventHandlers.accountsChanged.forEach(handler => handler(newAccount));
        }
    }

    handleChainChanged(chainId) {
        const newChainId = parseInt(chainId, 16);
        if (this._chainId !== newChainId) {
            this._chainId = newChainId;
            this.eventHandlers.chainChanged.forEach(handler => handler(newChainId));
        }
    }

    handleDisconnect() {
        this._account = null;
        this.eventHandlers.disconnect.forEach(handler => handler());
    }

    async initialize() {
        await this.ensureWalletAvailable();

        if (this._web3) return;

        try {
            this._web3 = new Web3(window.ethereum);
            window.ethereum.on('accountsChanged', this.handleAccountsChanged);
            window.ethereum.on('chainChanged', this.handleChainChanged);
            window.ethereum.on('disconnect', this.handleDisconnect);
            this._chainId = await this.getChainId();
        } catch (error) {
            console.error('Failed to initialize Web3:', error);
            throw error;
        }
    }

    createContract(abi, address) {
        if (!this._web3) {
            throw new Error('Web3 not initialized');
        }
        if (!this._account) {
            throw new Error('Wallet not connected');
        }
        return new this._web3.eth.Contract(abi, address);
    }

    async connect() {
        await this.ensureWalletAvailable();

        try {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts available');
            }

            this._account = accounts[0];
            await this.initialize();

            return {
                account: this._account,
                chainId: this._chainId
            };
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            if (error.code === 4001) {
                throw new Error('Please approve wallet connection to continue');
            }
            throw error;
        }
    }

    async disconnect() {
        if (window.ethereum) {
            window.ethereum.removeListener('accountsChanged', this.handleAccountsChanged);
            window.ethereum.removeListener('chainChanged', this.handleChainChanged);
            window.ethereum.removeListener('disconnect', this.handleDisconnect);
        }
        this._account = null;
        this._chainId = null;
        this._web3 = null;
        this.eventHandlers.disconnect.forEach(handler => handler());
    }

    async getChainId() {
        await this.ensureWalletAvailable();
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        return parseInt(chainId, 16);
    }

    async validateChainId(expectedChainId) {
        const currentChainId = await this.getChainId();
        if (currentChainId !== expectedChainId) {
            throw new Error(`Please switch to the correct network (Chain ID: ${expectedChainId})`);
        }
    }

    on(event, handler) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].push(handler);
        }
    }

    off(event, handler) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
        }
    }
}

const web3Service = new Web3Service();
export default web3Service;
