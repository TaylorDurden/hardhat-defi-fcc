require('@nomiclabs/hardhat-waffle');
require('hardhat-gas-reporter');
require('@nomiclabs/hardhat-etherscan');
require('dotenv').config();
require('solidity-coverage');
require('hardhat-deploy');

const MAINNET_RPC_URL =
  process.env.MAINNET_RPC_URL || process.env.ALCHEMY_MAINNET_RPC_URL || '';
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // solidity: "0.8.24",
  solidity: {
    compilers: [
      { version: '0.8.7' },
      { version: '0.6.0' },
      { version: '0.6.6' },
      { version: '0.6.12' },
      { version: '0.4.19' },
    ],
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      chainId: 31337,
      blockConfirmations: 1,
      forking: {
        url: MAINNET_RPC_URL,
      },
    },
    sepolia: {
      url: SEPOLIA_RPC_URL || '',
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
      blockConfirmations: 6,
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    outputFile: 'gas-report.txt',
    noColors: true,
    coinmarketcap: COINMARKETCAP_API_KEY,
    token: 'ETH',
  },
  mocha: {
    timeout: 500000, // 200 seconds max
    setTimeout: 500000,
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
    },
  },
};
