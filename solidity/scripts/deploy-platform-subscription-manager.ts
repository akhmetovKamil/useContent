import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import hre from "hardhat";

interface DeploymentRegistryInput {
  chainId: number;
  address: string;
  platformTreasury: string;
  paymentToken: string;
  deployedBy: string;
  deploymentTxHash: string | null;
}

interface PlatformSubscriptionManagerContract {
  registerTier(
    tierKey: string,
    price: bigint,
    baseStorageGb: number,
    maxExtraStorageGb: number,
    pricePerExtraGb: bigint,
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

  const manager = await ethers.deployContract("PlatformSubscriptionManager", [
    deployer.address,
    platformTreasury,
    paymentToken,
  ]);
  await manager.waitForDeployment();

  const address = await manager.getAddress();
  const deploymentTxHash = manager.deploymentTransaction()?.hash ?? null;
  const chainIdString = network.chainId.toString();
  const deploymentPath = resolve(
    import.meta.dirname,
    "../../shared/deployments",
    `${chainIdString}.json`,
  );

  await registerDefaultBasicTier(
    manager as unknown as PlatformSubscriptionManagerContract,
  );
  await writeDeploymentFile(deploymentPath, {
    chainId,
    platformSubscriptionManager: address,
    platformTreasury,
    platformPaymentToken: paymentToken,
    platformSubscriptionManagerDeployedBy: deployer.address,
    platformSubscriptionManagerDeploymentTxHash: deploymentTxHash,
  });

  const deployment = {
    chainId,
    address,
    platformTreasury,
    paymentToken,
    deployedBy: deployer.address,
    deploymentTxHash,
  };

  console.log(
    `PlatformSubscriptionManager deployed to ${address} on chain ${chainId}`,
  );
  console.log(`Deployment metadata saved to ${deploymentPath}`);
  await trySyncDeploymentRegistry(deployment);
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
  manager: PlatformSubscriptionManagerContract,
) {
  const { ethers } = await hre.network.connect();
  const tierKey =
    process.env.PLATFORM_BASIC_TIER_KEY ?? ethers.id("platform:basic");
  const price = BigInt(process.env.PLATFORM_BASIC_PRICE ?? "5000000");
  const baseStorageGb = Number(
    process.env.PLATFORM_BASIC_BASE_STORAGE_GB ?? "3",
  );
  const maxExtraStorageGb = Number(
    process.env.PLATFORM_BASIC_MAX_EXTRA_STORAGE_GB ?? "10",
  );
  const pricePerExtraGb = BigInt(
    process.env.PLATFORM_BASIC_PRICE_PER_EXTRA_GB ?? "1000000",
  );
  const periodSeconds = BigInt(
    process.env.PLATFORM_BASIC_PERIOD_SECONDS ?? String(30 * 24 * 60 * 60),
  );

  const tx = await manager.registerTier(
    tierKey,
    price,
    baseStorageGb,
    maxExtraStorageGb,
    pricePerExtraGb,
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

async function trySyncDeploymentRegistry(input: DeploymentRegistryInput) {
  try {
    await syncDeploymentRegistry(input);
  } catch (error) {
    console.warn(
      error instanceof Error
        ? error.message
        : "Failed to sync platform deployment registry",
    );
    console.warn(
      "Deployment succeeded, but registry sync failed. Fix DEPLOYMENT_REGISTRY_TOKEN and sync this address later.",
    );
  }
}

async function syncDeploymentRegistry(input: DeploymentRegistryInput) {
  const apiBaseUrl = process.env.API_BASE_URL;
  const token = process.env.DEPLOYMENT_REGISTRY_TOKEN;
  if (!apiBaseUrl || !token || apiBaseUrl === "NONE" || token === "NONE") {
    console.warn(
      "Deployment registry sync skipped because API_BASE_URL or DEPLOYMENT_REGISTRY_TOKEN is not configured.",
    );
    return;
  }

  const response = await fetch(
    `${apiBaseUrl.replace(/\/$/, "")}/admin/contract-deployments`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Deployment-Registry-Token": token,
      },
      body: JSON.stringify({
        chainId: input.chainId,
        contractName: "PlatformSubscriptionManager",
        address: input.address,
        platformTreasury: input.platformTreasury,
        deployedBy: input.deployedBy,
        deploymentTxHash: input.deploymentTxHash,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to sync deployment registry: ${response.status} ${await response.text()}`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
