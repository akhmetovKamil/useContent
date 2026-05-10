import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import hre from "hardhat";

type PlatformContractName = "PlatformTierManager" | "PlatformStorageManager";

interface DeploymentRegistryInput {
  chainId: number;
  contractName: PlatformContractName;
  address: string;
  platformTreasury: string;
  deployedBy: string;
  deploymentTxHash: string | null;
}

interface PlatformTierManagerContract {
  registerTier(
    tierKey: string,
    price: bigint,
    baseStorageGb: number,
    periodSeconds: bigint,
  ): Promise<{ wait(): Promise<unknown> }>;
}

const knownUsdcByChainId = new Map<number, string>([
  [11155111, "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"],
  [84532, "0x036CbD53842c5426634e7929541eC2318f3dCF7e"],
  [11155420, "0x5fd84259d66Cd46123540766Be93DFE6D43130D7"],
  [421614, "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"],
  [8453, "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"],
  [10, "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85"],
  [42161, "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"],
]);

async function main() {
  const { ethers } = await hre.network.connect();
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  const platformTreasury = process.env.PLATFORM_TREASURY ?? deployer.address;
  const paymentToken = resolvePlatformPaymentToken(chainId);
  const periodSeconds = BigInt(
    process.env.PLATFORM_BASIC_PERIOD_SECONDS ?? String(30 * 24 * 60 * 60),
  );
  const baseStorageGb = Number(
    process.env.PLATFORM_BASIC_BASE_STORAGE_GB ?? "3",
  );
  const maxExtraStorageGb = Number(
    process.env.PLATFORM_BASIC_MAX_EXTRA_STORAGE_GB ?? "10",
  );
  const pricePerExtraGb = BigInt(
    process.env.PLATFORM_BASIC_PRICE_PER_EXTRA_GB ?? "1000000",
  );

  const tierManager = await ethers.deployContract("PlatformTierManager", [
    deployer.address,
    platformTreasury,
    paymentToken,
  ]);
  await tierManager.waitForDeployment();
  const tierManagerAddress = await tierManager.getAddress();
  await registerDefaultBasicTier(
    tierManager as unknown as PlatformTierManagerContract,
    baseStorageGb,
    periodSeconds,
  );

  const storageManager = await ethers.deployContract("PlatformStorageManager", [
    deployer.address,
    platformTreasury,
    paymentToken,
    pricePerExtraGb,
    maxExtraStorageGb,
    periodSeconds,
  ]);
  await storageManager.waitForDeployment();
  const storageManagerAddress = await storageManager.getAddress();

  const deploymentPath = resolve(
    import.meta.dirname,
    "../../shared/deployments",
    `${network.chainId.toString()}.json`,
  );
  await writeDeploymentFile(deploymentPath, {
    chainId,
    platformTierManager: tierManagerAddress,
    platformStorageManager: storageManagerAddress,
    platformTreasury,
    platformPaymentToken: paymentToken,
    platformTierManagerDeployedBy: deployer.address,
    platformStorageManagerDeployedBy: deployer.address,
    platformTierManagerDeploymentTxHash:
      tierManager.deploymentTransaction()?.hash ?? null,
    platformStorageManagerDeploymentTxHash:
      storageManager.deploymentTransaction()?.hash ?? null,
  });

  const deployments: DeploymentRegistryInput[] = [
    {
      chainId,
      contractName: "PlatformTierManager",
      address: tierManagerAddress,
      platformTreasury,
      deployedBy: deployer.address,
      deploymentTxHash: tierManager.deploymentTransaction()?.hash ?? null,
    },
    {
      chainId,
      contractName: "PlatformStorageManager",
      address: storageManagerAddress,
      platformTreasury,
      deployedBy: deployer.address,
      deploymentTxHash: storageManager.deploymentTransaction()?.hash ?? null,
    },
  ];

  console.log(`PlatformTierManager deployed to ${tierManagerAddress} on chain ${chainId}`);
  console.log(`PlatformStorageManager deployed to ${storageManagerAddress} on chain ${chainId}`);
  console.log(`Deployment metadata saved to ${deploymentPath}`);
  for (const deployment of deployments) {
    await syncDeploymentRegistry(deployment);
    await verifyDeploymentRegistry(deployment);
  }
}

function resolvePlatformPaymentToken(chainId: number): string {
  const configured = process.env.PLATFORM_PAYMENT_TOKEN?.trim();
  if (configured && configured !== "NONE") {
    console.log(`Using platform payment token from secret override: ${configured}`);
    return configured;
  }

  const knownUsdc = knownUsdcByChainId.get(chainId);
  if (knownUsdc) {
    console.log(`Using known USDC default for chain ${chainId}: ${knownUsdc}`);
    return knownUsdc;
  }

  throw new Error(
    `PLATFORM_PAYMENT_TOKEN is not configured and no known USDC default exists for chain ${chainId}. Add a token mapping or configure the PLATFORM_PAYMENT_TOKEN secret.`,
  );
}

async function registerDefaultBasicTier(
  manager: PlatformTierManagerContract,
  baseStorageGb: number,
  periodSeconds: bigint,
) {
  const { ethers } = await hre.network.connect();
  const tierKey =
    process.env.PLATFORM_BASIC_TIER_KEY ?? ethers.id("platform:basic");
  const price = BigInt(process.env.PLATFORM_BASIC_PRICE ?? "5000000");

  const tx = await manager.registerTier(
    tierKey,
    price,
    baseStorageGb,
    periodSeconds,
  );
  await tx.wait();

  console.log(`Registered Basic platform tier ${tierKey}`);
}

async function writeDeploymentFile(
  path: string,
  update: Record<string, unknown>,
) {
  let existing: Record<string, unknown> = {};
  try {
    existing = JSON.parse(await readFile(path, "utf8")) as Record<
      string,
      unknown
    >;
  } catch {
    existing = {};
  }

  await mkdir(dirname(path), { recursive: true });
  await writeFile(
    path,
    `${JSON.stringify({ ...existing, ...update }, null, 2)}\n`,
  );
}

function getRegistryConfig(): { apiBaseUrl: string; token: string } | null {
  if (process.env.SKIP_DEPLOYMENT_REGISTRY_SYNC === "true") {
    console.warn("Deployment registry sync skipped by SKIP_DEPLOYMENT_REGISTRY_SYNC=true.");
    return null;
  }

  const apiBaseUrl = process.env.API_BASE_URL;
  const token = process.env.DEPLOYMENT_REGISTRY_TOKEN;
  if (!apiBaseUrl || !token || apiBaseUrl === "NONE" || token === "NONE") {
    throw new Error(
      "API_BASE_URL and DEPLOYMENT_REGISTRY_TOKEN are required for platform billing deployments. Use SKIP_DEPLOYMENT_REGISTRY_SYNC=true only for local/manual dry runs.",
    );
  }

  return { apiBaseUrl: apiBaseUrl.replace(/\/$/, ""), token };
}

async function syncDeploymentRegistry(input: DeploymentRegistryInput) {
  const config = getRegistryConfig();
  if (!config) {
    return;
  }

  console.log(
    `Syncing ${input.contractName} ${input.address} on chain ${input.chainId} to ${config.apiBaseUrl}`,
  );
  const response = await fetch(`${config.apiBaseUrl}/admin/contract-deployments`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Deployment-Registry-Token": config.token,
    },
    body: JSON.stringify({
      chainId: input.chainId,
      contractName: input.contractName,
      address: input.address,
      platformTreasury: input.platformTreasury,
      deployedBy: input.deployedBy,
      deploymentTxHash: input.deploymentTxHash,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to sync ${input.contractName}: ${response.status} ${await response.text()}`,
    );
  }
}

async function verifyDeploymentRegistry(input: DeploymentRegistryInput) {
  const config = getRegistryConfig();
  if (!config) {
    return;
  }

  const path =
    input.contractName === "PlatformTierManager"
      ? "platform-tier-manager"
      : "platform-storage-manager";
  const url = `${config.apiBaseUrl}/contract-deployments/${path}/${input.chainId}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to read back ${input.contractName}: ${response.status} ${await response.text()}`,
    );
  }

  const payload = (await response.json()) as {
    deployment?: { address?: string } | null;
  };
  const actual = payload.deployment?.address?.toLowerCase();
  if (actual !== input.address.toLowerCase()) {
    throw new Error(
      `Registry read-back mismatch for ${input.contractName}: expected ${input.address}, got ${payload.deployment?.address ?? "null"}`,
    );
  }
  console.log(`Registry read-back ok for ${input.contractName}: ${input.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
