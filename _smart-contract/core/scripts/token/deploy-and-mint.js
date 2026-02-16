require("dotenv").config();
const { ethers, upgrades } = require("hardhat");

async function main() {
    try {
        console.log("Deploying NooriToken...");
        
        // Get the contract factory
        const NooriToken = await ethers.getContractFactory("NooriToken");
        console.log("Contract factory created...");

        // Deploy the proxy
        console.log("Deploying proxy...");
        const nooriToken = await upgrades.deployProxy(
            NooriToken,
            [],  // No parameters needed as they are hardcoded in initialize()
            { 
                initializer: "initialize",
                timeout: 0 // disable timeout
            }
        );

        // Wait for the deployment
        await nooriToken.waitForDeployment();
        const proxyAddress = await nooriToken.getAddress();
        console.log("NooriToken proxy deployed to:", proxyAddress);

        // Get the implementation address
        const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
        console.log("NooriToken implementation address:", implementationAddress);

        // Mint 1 billion tokens to the deployer
        const deployer = (await ethers.getSigners())[0];
        const amount = ethers.parseEther("1000000000"); // 1 billion tokens with 18 decimals
        
        console.log("\nMinting tokens...");
        // Note: The deployer already has MINTER_ROLE from initialize()
        const mintTx = await nooriToken.mint(deployer.address, amount);
        await mintTx.wait();
        
        // Verify the balance
        const balance = await nooriToken.balanceOf(deployer.address);
        console.log(`Minted ${ethers.formatEther(balance)} NOORI tokens to ${deployer.address}`);

        console.log("\nDeployment and minting complete!");
        console.log("Contract addresses to save:");
        console.log("PROXY_ADDRESS=", proxyAddress);
        console.log("IMPLEMENTATION_ADDRESS=", implementationAddress);
    } catch (error) {
        console.error("Error during deployment:");
        console.error(error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
