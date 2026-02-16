// scripts/upgradeNooriToken.js
const { ethers, upgrades } = require("hardhat");

async function main() {
    // Get the deployed proxy contract address
    const proxyAddress = process.env.PROXY_ADDRESS; // proxy address

    // Get the new implementation contract (NooriTokenV2)
    const NooriTokenV2 = await ethers.getContractFactory("NooriTokenV2");

    // Upgrade the proxy to the new implementation
    const upgraded = await upgrades.upgradeProxy(proxyAddress, NooriTokenV2);

    console.log("NooriToken proxy upgraded to:", upgraded.address);
    console.log("New implementation address:", await upgrades.erc1967.getImplementationAddress(upgraded.address));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
