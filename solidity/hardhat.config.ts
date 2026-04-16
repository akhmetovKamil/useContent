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
      url: configVariable("RPC_URL_11155111"),
      accounts: deployerAccounts,
    },
    baseSepolia: {
      type: "http",
      chainType: "op",
      chainId: 84532,
      url: configVariable("RPC_URL_84532"),
      accounts: deployerAccounts,
    },
    optimismSepolia: {
      type: "http",
      chainType: "op",
      chainId: 11155420,
      url: configVariable("RPC_URL_11155420"),
      accounts: deployerAccounts,
    },
    arbitrumSepolia: {
      type: "http",
      chainType: "generic",
      chainId: 421614,
      url: configVariable("RPC_URL_421614"),
      accounts: deployerAccounts,
    },
    base: {
      type: "http",
      chainType: "op",
      chainId: 8453,
      url: configVariable("RPC_URL_8453"),
      accounts: deployerAccounts,
    },
    optimism: {
      type: "http",
      chainType: "op",
      chainId: 10,
      url: configVariable("RPC_URL_10"),
      accounts: deployerAccounts,
    },
    arbitrum: {
      type: "http",
      chainType: "generic",
      chainId: 42161,
      url: configVariable("RPC_URL_42161"),
      accounts: deployerAccounts,
    },
  },
});

function loadDotEnv() {
  loadDotEnvFile(resolve(import.meta.dirname, "../.env"));
  loadDotEnvFile(resolve(import.meta.dirname, ".env"));
}

function loadDotEnvFile(envPath: string) {
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
