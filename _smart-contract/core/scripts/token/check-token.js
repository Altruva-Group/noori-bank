require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    try {
        // Get the deployed contract
        const proxyAddress = "0xC9e6e1FC3613BD97494E2490f305C1323481ecB5";
        const NooriToken = await ethers.getContractFactory("NooriToken");
        const token = NooriToken.attach(proxyAddress);

        // Get basic token information
        const name = await token.name();
        const symbol = await token.symbol();
        const decimals = await token.decimals();
        
        console.log("Token Details:");
        console.log("Name:", name);
        console.log("Symbol:", symbol);
        console.log("Decimals:", decimals.toString());
        
        // Get the deployer's balance
        const deployer = (await ethers.getSigners())[0];
        const balance = await token.balanceOf(deployer.address);
        console.log("\nDeployer Address:", deployer.address);
        console.log("Deployer Balance:", ethers.formatEther(balance), "NOORI");

    } catch (error) {
        console.error("Error checking token:");
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
