/** @type import('hardhat/config').HardhatUserConfig */
require("dotenv").config();
require("@nomicfoundation/hardhat-verify");
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');

const { task } = require('hardhat/config');

task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

module.exports = {
  defaultNetwork: "ethTestnet",
  // defaultNetwork: "ethMainnet",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    hardhat: {
    },
    bscTestnet: {
      url: `${process.env.BSC_TESTNET_URL}`,
      accounts: [`${process.env.PRIVATE_KEY}`],
      chainId: 97,
      gasPrice: 20000000000,
    },
    bscMainnet: {
      url: `${process.env.BSC_MAINNET_URL}`, 
      accounts: [`${process.env.PRIVATE_KEY}`], 
      chainId: 56,
      gasPrice: 20000000000,
    },
    ethTestnet: {
      url: `${process.env.ETH_TESTNET_URL}`,
      accounts: [`${process.env.PRIVATE_KEY}`]
    },
    ethMainnet: {
      url: `${process.env.ETH_MAINNET_URL}`, 
      accounts: [`${process.env.PRIVATE_KEY}`], 
      chainId: 1
    },
    testnet: {
      url: process.env.RPC_URL_TESTNET,
      accounts: [process.env.PRIVATE_KEY],
      timeout: 120000, // 2 minutes
      gasPrice: "auto",
      networkTimeout: 120000,
      confirmations: 2,
      timeoutBlocks: 200
    }
  },
  solidity: {
    version: "0.8.27",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        details: {
          yulDetails: {
            optimizerSteps: "u",
          },
        },
      },
    },
    // settings: {
    //   optimizer: {
    //     enabled: true,
    //     runs: 2,
    //     // details: { yul: false },
    //   }
    // }
  },
  etherscan: {
    apiKey: `${process.env.ETHERSCAN_API}`
  },
  sourcify: {
    enabled: true
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  }
};