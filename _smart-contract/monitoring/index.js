// monitoring/index.js
require('dotenv').config();
const EventMonitor = require('./eventMonitor');

const config = {
    rpcUrl: process.env.RPC_URL,
    tokenAddress: process.env.TOKEN_ADDRESS,
    vaultAddress: process.env.VAULT_ADDRESS,
    bridgeAddress: process.env.BRIDGE_ADDRESS,
    kycAddress: process.env.KYC_ADDRESS,
    oracleAddress: process.env.ORACLE_ADDRESS,
    tokenAbi: require('../core/artifacts/contracts/token/NooriToken.sol/NooriToken.json').abi,
    vaultAbi: require('../core/artifacts/contracts/vault/NooriVault.sol/NooriBankVault.json').abi,
    bridgeAbi: require('../core/artifacts/contracts/relay/NooriBankBridge.sol/NooriBankBridge.json').abi,
    kycAbi: require('../core/artifacts/contracts/kyc/DidItMeKYC.sol/DidItMeKYC.json').abi,
    oracleAbi: require('../core/artifacts/contracts/oracle/NooriBankPriceOracle.sol/NooriBankPriceOracle.json').abi
};

const monitor = new EventMonitor(config);
monitor.start().catch(console.error);