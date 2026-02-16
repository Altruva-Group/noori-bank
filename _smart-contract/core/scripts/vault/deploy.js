require("dotenv").config();
const { ethers, upgrades } = require("hardhat");

const main = async () => {
    const nativeToken = process.env.PROXY_ADDRESS_CA_TESTNET;
    const kycService = process.env.KYC_SERVICE_ADDRESS || "0x0000000000000000000000000000000000000000"; // KYC service address
    const vaultName = "NooriBank Vault";
    const vaultSymbol = "NBVault";

    // Deploy NooriBankVault implementation
    const NooriBankVault = await ethers.getContractFactory("NooriBankVault");
    console.log("Contract factory created...");

    console.log("Deploying proxy...");
    const nooriBankVault = await upgrades.deployProxy(
        NooriBankVault,
        [nativeToken, vaultName, vaultSymbol, kycService],
        {
            initializer: 'initialize',
            kind: 'uups',
            timeout: 0
        }
    );

    await nooriBankVault.waitForDeployment();
    const proxyAddress = await nooriBankVault.getAddress();
    console.log(`NooriBank Vault proxy deployed to: ${proxyAddress}`);

    // Get the implementation address
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log(`NooriBank Vault implementation deployed to: ${implementationAddress}`);
}

const runMain = async () => {
    try {
        await main();
        process.exit(0);
    } catch (error) {
        console.error({error});
        process.exit(1);
    }
}

runMain();