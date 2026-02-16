require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    try {
        // Get the deployed contract
        const proxyAddress = "0xC9e6e1FC3613BD97494E2490f305C1323481ecB5";
        const NooriToken = await ethers.getContractFactory("NooriToken");
        const token = NooriToken.attach(proxyAddress);

        // Get the deployer account (which should have MINTER_ROLE)
        const deployer = (await ethers.getSigners())[0];
        console.log("Minting from address:", deployer.address);

        // Amount to mint: 1 billion tokens (with 18 decimals)
        const amount = ethers.parseEther("1000000000"); // 1 billion with 18 decimals
        
        console.log("Minting 1 billion NOORI tokens...");
        const tx = await token.mintTo(deployer.address, amount);
        console.log("Mint transaction hash:", tx.hash);
        
        // Wait for the transaction to be mined
        await tx.wait();
        console.log("Tokens minted successfully!");

        // Verify the new balance
        const balance = await token.balanceOf(deployer.address);
        console.log("New balance:", ethers.formatEther(balance), "NOORI");

    } catch (error) {
        console.error("Error minting tokens:");
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
