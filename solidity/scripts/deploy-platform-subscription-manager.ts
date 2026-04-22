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

async function main() {
  const { ethers } = await hre.network.connect();
  const [deployer] = await ethers.getSigners();
  const platformTreasury = process.env.PLATFORM_TREASURY ?? deployer.address;
  const paymentToken = process.env.PLATFORM_PAYMENT_TOKEN;

  if (!paymentToken || paymentToken === "NONE") {
    throw new Error(
      "PLATFORM_PAYMENT_TOKEN must be configured for PlatformSubscriptionManager",
    );
  }

  const manager = await ethers.deployContract("PlatformSubscriptionManager", [
    deployer.address,
    platformTreasury,
    paymentToken,
  ]);
  await manager.waitForDeployment();

  const address = await manager.getAddress();
  const deploymentTxHash = manager.deploymentTransaction()?.hash ?? null;
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();
  const deploymentPath = resolve(
    import.meta.dirname,
    "../../shared/deployments",
    `${chainId}.json`,
  );

  await registerDefaultBasicTier(
    manager as unknown as PlatformSubscriptionManagerContract,
  );
  await writeDeploymentFile(deploymentPath, {
    chainId: Number(chainId),
    platformSubscriptionManager: address,
    platformTreasury,
    platformPaymentToken: paymentToken,
    platformSubscriptionManagerDeployedBy: deployer.address,
    platformSubscriptionManagerDeploymentTxHash: deploymentTxHash,
  });

  const deployment = {
    chainId: Number(chainId),
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
