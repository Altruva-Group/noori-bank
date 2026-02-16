require("dotenv").config();
const { ethers, upgrades } = require("hardhat");
const { parseEther, formatEther } = ethers;

async function deployWithRetry(deployFn, maxAttempts = 3) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`Deployment attempt ${attempt}/${maxAttempts}...`);
            return await deployFn();
        } catch (error) {
            if (attempt === maxAttempts) {
                throw error;
            }
            console.log(`Attempt ${attempt} failed. Retrying in 5 seconds...`);
            console.log("Error details:", error.message || error);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

const main = async () => {
    try {
        // Get deployment parameters from environment variables
        const nativeToken = process.env.PROXY_ADDRESS_CA_TESTNET;
        const lzEndpoint = process.env.LZ_ENDPOINT_ADDRESS_TESTNET;
        const minGasForTransfer = parseEther("0.000001");

        // Validate parameters
        if (!nativeToken) throw new Error("PROXY_ADDRESS_CA_TESTNET not set in environment");
        if (!lzEndpoint) throw new Error("LZ_ENDPOINT_ADDRESS_TESTNET not set in environment");

        console.log("Network info:");
        const network = await ethers.provider.getNetwork();
        console.log("- Network:", network.name);
        console.log("- Chain ID:", network.chainId);

        console.log("\nDeployment Parameters:");
        console.log("- Token Address:", nativeToken);
        console.log("- LayerZero Endpoint:", lzEndpoint);
        console.log("- Min Gas For Transfer:", formatEther(minGasForTransfer), "ETH");

        // Deploy NooriBankBridge implementation
        const NooriBankBridge = await ethers.getContractFactory("NooriBankBridge");
        console.log("\nContract factory created...");

        console.log("Deploying proxy...");
        const nooriBankBridge = await deployWithRetry(async () => {
            const deployment = await upgrades.deployProxy(
                NooriBankBridge,
                [nativeToken, lzEndpoint, minGasForTransfer],
                {
                    initializer: 'initialize',
                    kind: 'uups',
                    timeout: 120000 // Increase timeout to 2 minutes
                }
            );
            await deployment.waitForDeployment();
            return deployment;
        });

        const proxyAddress = await nooriBankBridge.getAddress();
        console.log(`\nNooriBank Bridge proxy deployed to: ${proxyAddress}`);

        // Get the implementation address
        const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
        console.log(`NooriBank Bridge implementation deployed to: ${implementationAddress}`);

        // Verify deployment
        console.log("\nVerifying deployment...");
        const code = await ethers.provider.getCode(proxyAddress);
        if (code === '0x') {
            throw new Error('Deployment verification failed - no code at proxy address');
        }

        console.log("\nDeployment completed successfully!");
        console.log("Don't forget to:");
        console.log("1. Verify the contract on Etherscan");
        console.log("2. Set up supported chains using registerChain()");
        console.log("3. Configure the bridge on other chains");

        return { proxyAddress, implementationAddress };
    } catch (error) {
        console.error("\nDeployment failed!");
        console.error("Error details:", error);
        console.error("Stack trace:", error.stack);
        throw error;
    }
}

const runMain = async () => {
    try {
        await main();
        process.exit(0);
    } catch (error) {
        console.error("\nFatal error:");
        console.error(error);
        process.exit(1);
    }
}

runMain();