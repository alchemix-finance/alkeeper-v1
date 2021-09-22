import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-typechain";
import "hardhat-contract-sizer";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-deploy-ethers";

import process from "process";

require('dotenv').config()

const genRanHex = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

export default {
  contractSizer: {
    alphaSort: true,
    runOnCompile: !!process.env.REPORT_CONTRACT_SIZES,
  },
  etherscan: {
    apiKey: process.env["ETHERSCAN_API_KEY"] ?? ""
  },
  gasReporter: {
    enabled: !!process.env.REPORT_GAS,
  },
  namedAccounts: {
    deployer: 0,
  },
  networks: {
    coverage: {
      url: "http://localhost:8555",
      gas: 20000000,
    },
    hardhat: {
      chainId: 1337,
      gasPrice: Number(process.env['GAS_PRICE']) * 1000000000,
      allowUnlimitedContractSize: false,
      blockGasLimit: 25000000,
      forking: {
        url: `https://mainnet.infura.io/v3/${process.env["INFURA_MAINNET_KEY"]}`,
      },
      accounts: [
        {privateKey: process.env['MAINNET_DEPLOYER_PK'] || genRanHex(64), balance: "1000000000000000000000000"},
        {privateKey: genRanHex(64), balance: "1000000000000000000000000"},
        {privateKey: genRanHex(64), balance: "1000000000000000000000000"}
      ]
    },
    mainnet: {
      chainId: 1,
      gasPrice: Number(process.env['GAS_PRICE']) * 1000000000,
      url: process.env["HTTP_NODE"] ?? `https://mainnet.infura.io/v3/${process.env["INFURA_MAINNET_KEY"]}`,
      timeout: 6000000,
      accounts: [
        process.env['MAINNET_DEPLOYER_PK'] || genRanHex(64)
      ],
    },
    kovan: {
      chainId: 42,
      gas: 8000000,
      url: process.env["HTTP_NODE"] ?? `https://kovan.infura.io/v3/${process.env["INFURA_ROPSTEN_KEY"]}`,
      timeout: 600000,
      accounts: [
        process.env['KOVAN_DEPLOYER_PK'] || genRanHex(64)
      ]
    }
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 999999,
      },
    },
  },
  typechain: {
    outDir: "types",
    target: "ethers-v5"
  },
};