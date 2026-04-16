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
      },
      null,
      2,
    )}\n`,
  );

  console.log(`SubscriptionManager deployed to ${address} on chain ${chainId}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
