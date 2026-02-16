import { ethers } from 'ethers';
import { getSigner } from './provider';
import { contractAddresses } from '../../config/contracts';
import VaultABI from '../../utils/smart-contract/abi/VaultHandler.json';
import TokenABI from '../../utils/smart-contract/abi/NooriToken.json';
import BridgeABI from '../../utils/smart-contract/abi/NooriBankBridge.json';

class ContractService {
    constructor() {
        this.contracts = {};
        this.signer = null;
    }

    async initialize() {
        try {
            this.signer = await getSigner();
            await this.initializeContracts();
        } catch (error) {
            console.error('Error initializing contracts:', error);
            throw error;
        }
    }

    async initializeContracts() {
        this.contracts.vault = new ethers.Contract(
            contractAddresses.vault,
            VaultABI,
            this.signer
        );

        this.contracts.token = new ethers.Contract(
            contractAddresses.token,
            TokenABI,
            this.signer
        );

        this.contracts.bridge = new ethers.Contract(
            contractAddresses.bridge,
            BridgeABI,
            this.signer
        );
    }

    // Vault Operations
    async registerAccount(masterPassword, recoveryKey) {
        return await this.contracts.vault.register(masterPassword, recoveryKey);
    }

    async generateMemo() {
        return await this.contracts.vault.generateMemo();
    }

    async deposit(amount) {
        return await this.contracts.vault.deposit(amount);
    }

    async depositNative(amount) {
        return await this.contracts.vault.depositNative({ value: amount });
    }

    async depositToken(token, amount) {
        const tokenContract = new ethers.Contract(token, TokenABI, this.signer);
        await tokenContract.approve(contractAddresses.vault, amount);
        return await this.contracts.vault.depositToken(token, amount);
    }

    // Token Operations
    async getTokenBalance(token, account) {
        const tokenContract = new ethers.Contract(token, TokenABI, this.signer);
        return await tokenContract.balanceOf(account);
    }

    async transfer(to, amount) {
        return await this.contracts.token.transfer(to, amount);
    }

    // Bridge Operations
    async bridgeTokens(amount, targetChain, targetAddress) {
        await this.contracts.token.approve(contractAddresses.bridge, amount);
        return await this.contracts.bridge.lockTokens(amount, targetChain, targetAddress);
    }

    // View Functions
    async getAccountBalances(account) {
        const balances = {
            native: await this.contracts.vault.getNativeBalance(account),
            token: await this.contracts.token.balanceOf(account)
        };
        return balances;
    }

    async getFees() {
        const [transferFee, withdrawalFee] = await this.contracts.vault.getFees();
        return { transferFee, withdrawalFee };
    }

    async getRates() {
        const [depositRate, borrowRate, collateralRatio] = await this.contracts.vault.getRates();
        return { depositRate, borrowRate, collateralRatio };
    }
}

const contractService = new ContractService();
export default contractService;