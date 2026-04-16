import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable, defineConfig } from "hardhat/config";

const deployerAccounts = [configVariable("DEPLOYER_PRIVATE_KEY")];

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      chainId: 11155111,
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: deployerAccounts,
    },
    baseSepolia: {
      type: "http",
      chainType: "op",
      chainId: 84532,
      url: configVariable("BASE_SEPOLIA_RPC_URL"),
      accounts: deployerAccounts,
    },
    optimismSepolia: {
      type: "http",
      chainType: "op",
      chainId: 11155420,
      url: configVariable("OPTIMISM_SEPOLIA_RPC_URL"),
      accounts: deployerAccounts,
    },
    arbitrumSepolia: {
      type: "http",
      chainType: "generic",
      chainId: 421614,
      url: configVariable("ARBITRUM_SEPOLIA_RPC_URL"),
      accounts: deployerAccounts,
    },
    base: {
      type: "http",
      chainType: "op",
      chainId: 8453,
      url: configVariable("BASE_RPC_URL"),
      accounts: deployerAccounts,
    },
    optimism: {
      type: "http",
      chainType: "op",
      chainId: 10,
      url: configVariable("OPTIMISM_RPC_URL"),
      accounts: deployerAccounts,
    },
    arbitrum: {
      type: "http",
      chainType: "generic",
      chainId: 42161,
      url: configVariable("ARBITRUM_RPC_URL"),
      accounts: deployerAccounts,
    },
  },
});
