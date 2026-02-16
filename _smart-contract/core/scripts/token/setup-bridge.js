require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    try {
        // Get the deployed contract
        const proxyAddress = ""; // 0xC9e6e1FC3613BD97494E2490f305C1323481ecB5
        const NooriToken = await ethers.getContractFactory("NooriToken");
        const token = NooriToken.attach(proxyAddress);

        // Get the deployer account
        const deployer = (await ethers.getSigners())[0];
        console.log("Setting up bridge from address:", deployer.address);

        // Authorize the deployer as a bridge
        console.log("Authorizing deployer as bridge...");
        const tx = await token.setBridge(deployer.address, true);
        console.log("Authorization transaction hash:", tx.hash);
        
        // Wait for the transaction to be mined
        await tx.wait();
        console.log("Bridge authorization successful!");

        // Verify the bridge authorization
        const isBridge = await token.authorized_bridges(deployer.address);
        console.log("Is authorized bridge:", isBridge);

    } catch (error) {
        console.error("Error setting up bridge:");
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
