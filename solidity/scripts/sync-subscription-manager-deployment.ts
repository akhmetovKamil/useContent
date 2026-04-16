import { isAddress } from "ethers";

async function main() {
  const chainId = Number(process.env.CHAIN_ID);
  const address = process.env.SUBSCRIPTION_MANAGER_ADDRESS;
  const platformTreasury = process.env.PLATFORM_TREASURY;
  const deployedBy = process.env.DEPLOYED_BY;
  const deploymentTxHash = process.env.DEPLOYMENT_TX_HASH ?? null;

  if (!Number.isInteger(chainId) || chainId <= 0) {
    throw new Error("CHAIN_ID must be a positive integer");
  }
  assertAddress(address, "SUBSCRIPTION_MANAGER_ADDRESS");
  assertAddress(platformTreasury, "PLATFORM_TREASURY");
  assertAddress(deployedBy, "DEPLOYED_BY");

  const apiBaseUrl = process.env.API_BASE_URL;
  const token = process.env.DEPLOYMENT_REGISTRY_TOKEN;
  if (!apiBaseUrl || !token || apiBaseUrl === "NONE" || token === "NONE") {
    throw new Error("API_BASE_URL and DEPLOYMENT_REGISTRY_TOKEN are required");
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
        chainId,
        contractName: "SubscriptionManager",
        address,
        platformTreasury,
        deployedBy,
        deploymentTxHash,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to sync deployment registry: ${response.status} ${await response.text()}`,
    );
  }

  console.log(`Synced SubscriptionManager ${address} on chain ${chainId}`);
}

function assertAddress(value: string | undefined, name: string): asserts value is string {
  if (!value || !isAddress(value)) {
    throw new Error(`${name} must be a valid address`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
