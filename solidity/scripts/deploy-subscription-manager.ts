import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import hre from "hardhat";

async function main() {
  const { ethers } = await hre.network.connect();
  const [deployer] = await ethers.getSigners();
  const platformTreasury = process.env.PLATFORM_TREASURY ?? deployer.address;

  const manager = await ethers.deployContract("SubscriptionManager", [
    deployer.address,
    platformTreasury,
  ]);
  await manager.waitForDeployment();

  const address = await manager.getAddress();
  const deploymentTxHash = manager.deploymentTransaction()?.hash ?? null;
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();
  const deploymentPath = resolve(
    import.meta.dirname,
    "../../contracts/deployments",
    `${chainId}.json`,
  );

  await mkdir(dirname(deploymentPath), { recursive: true });
  await writeFile(
    deploymentPath,
    `${JSON.stringify(
      {
        chainId: Number(chainId),
        subscriptionManager: address,
        platformTreasury,
        deployedBy: deployer.address,
        deploymentTxHash,
      },
      null,
      2,
    )}\n`,
  );

  await syncDeploymentRegistry({
    chainId: Number(chainId),
    address,
    platformTreasury,
    deployedBy: deployer.address,
    deploymentTxHash,
  });

  console.log(`SubscriptionManager deployed to ${address} on chain ${chainId}`);
}

async function syncDeploymentRegistry(input: {
  chainId: number;
  address: string;
  platformTreasury: string;
  deployedBy: string;
  deploymentTxHash: string | null;
}) {
  const apiBaseUrl = process.env.API_BASE_URL;
  const token = process.env.DEPLOYMENT_REGISTRY_TOKEN;
  if (!apiBaseUrl || !token || apiBaseUrl === "NONE" || token === "NONE") {
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
        contractName: "SubscriptionManager",
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
