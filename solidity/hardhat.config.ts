import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable, defineConfig } from "hardhat/config";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

loadDotEnv();

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

function loadDotEnv() {
  const envPath = resolve(import.meta.dirname, ".env");
  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    process.env[key] ??= valueParts.join("=").replace(/^["']|["']$/g, "");
  }
}
