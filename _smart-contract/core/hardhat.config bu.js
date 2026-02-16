/** @type import('hardhat/config').HardhatUserConfig */

require('@nomiclabs/hardhat-waffle');
require("dotenv").config()
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
  defaultNetwork: "bscMainnet",
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
    }
  },
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
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