require("dotenv").config();
const { ethers, upgrades } = require("hardhat");


// async function main() {
//     const Box = await ethers.getContractFactory("Box");
//     const box = await upgrades.deployProxy(Box, [42]);
//     await box.waitForDeployment();
//     console.log("Box deployed to:", await box.getAddress());
//   }
  
//   main();



// require("dotenv").config();
// const hre = require("hardhat");

// const main = async () => {
//     // deploy the SignatureChecker library to remove this deployment error:
//     // The contract FiatToken is missing links for the following libraries:
//     //   * contracts/token/lib.sol:SignatureChecker
//     const DeploySignatureChecker = await hre.ethers.getContractFactory("SignatureChecker");
//     const deploySignatureChecker = await DeploySignatureChecker.deploy();
//     await deploySignatureChecker.deployed();
//     console.log(`DeploySignatureChecker deployed to: ${deploySignatureChecker.address}`)

//     // deploy token
//     const FiatToken = await hre.ethers.getContractFactory("FiatToken", {
//         libraries: {
//             SignatureChecker: deploySignatureChecker.address,
//         },
//     });
//     const fiatToken = await FiatToken.deploy(
//         "NovaToken", "NOVA", "USD"
//     );

//     await fiatToken.deployed();
//     console.log(`FiatToken deployed to: ${fiatToken.address}`);
// }

// const runMain = async () => {
//     try {
//         await main();
//         process.exit(0);
//     } catch (error) {
//         console.error({error});
//         process.exit(1);
//     }
// }

// runMain();


// // deploy.js
// const { deploy } = require('@openzeppelin/hardhat-deploy');

// module.exports = async ({ getNamedAccounts, deployments }) => {
//   const { deployer } = await getNamedAccounts();
//   const { deploy } = deployments;

//   await deploy('SignatureChecker', {
//     from: deployer,
//     log: true,
//   });

//   const fiatTokenConstructorArgs = [
//     "NovaToken", 
//     "NOVA", 
//     "USD",
//     deployer,
//   ];

//   await deploy('FiatToken', {
//     from: deployer,
//     log: true,
//     args: fiatTokenConstructorArgs,
//     libraries: {
//       SignatureChecker: (await deployments.get('SignatureChecker')).address,
//     },
//   });
// };