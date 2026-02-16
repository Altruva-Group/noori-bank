require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    try {
        // Get the deployed contract
        const proxyAddress = "0xC9e6e1FC3613BD97494E2490f305C1323481ecB5";
        const NooriToken = await ethers.getContractFactory("NooriToken");
        const token = NooriToken.attach(proxyAddress);

        // Get the owner
        const owner = await token.owner();
        console.log("Contract owner:", owner);

        // Check roles
        const UPGRADER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("UPGRADER_ROLE"));
        const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
        const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";

        const deployer = (await ethers.getSigners())[0];
        console.log("Deployer address:", deployer.address);

        // Check roles for the deployer
        const hasUpgraderRole = await token.hasRole(UPGRADER_ROLE, deployer.address);
        const hasAdminRole = await token.hasRole(ADMIN_ROLE, deployer.address);
        const hasDefaultAdminRole = await token.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);

        console.log("\nRole assignments for deployer:");
        console.log("UPGRADER_ROLE:", hasUpgraderRole);
        console.log("ADMIN_ROLE:", hasAdminRole);
        console.log("DEFAULT_ADMIN_ROLE:", hasDefaultAdminRole);

    } catch (error) {
        console.error("Error during verification:");
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
