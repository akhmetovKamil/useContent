import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import hre from "hardhat";

interface DeploymentRegistryInput {
  chainId: number;
  address: string;
  platformTreasury: string;
  deployedBy: string;
  deploymentTxHash: string | null;
}

interface RegistryConfig {
  apiBaseUrl: string;
  source: "REGISTRY_API_BASE_URL" | "API_BASE_URL";
  token: string;
}

async function main() {
  const { ethers } = await hre.network.connect();
  const [deployer] = await ethers.getSigners();
  const platformTreasury = process.env.PLATFORM_TREASURY?.trim() || deployer.address;
  const registryConfig = getRegistryConfig();
  await verifyRegistryConnection(registryConfig);

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
    "../../shared/deployments",
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

  const deployment = {
    chainId: Number(chainId),
    address,
    platformTreasury,
    deployedBy: deployer.address,
    deploymentTxHash,
  };

  console.log(`SubscriptionManager deployed to ${address} on chain ${chainId}`);
  console.log(`Deployment metadata saved to ${deploymentPath}`);
  await syncDeploymentRegistry(deployment, registryConfig);
  await verifyDeploymentRegistry(deployment, registryConfig);
}

function getRegistryConfig(): RegistryConfig {
  const registryApiBaseUrl = process.env.REGISTRY_API_BASE_URL?.trim();
  const fallbackApiBaseUrl = process.env.API_BASE_URL?.trim();
  const source = registryApiBaseUrl
    ? "REGISTRY_API_BASE_URL"
    : "API_BASE_URL";
  const apiBaseUrl = registryApiBaseUrl || fallbackApiBaseUrl;
  const token = process.env.DEPLOYMENT_REGISTRY_TOKEN;
  if (!apiBaseUrl || !token || apiBaseUrl === "NONE" || token === "NONE") {
    throw new Error(
      "REGISTRY_API_BASE_URL and DEPLOYMENT_REGISTRY_TOKEN are required for SubscriptionManager deployments. Set REGISTRY_API_BASE_URL to the public backend API, for example https://api.usecontent.app.",
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(apiBaseUrl);
  } catch {
    throw new Error(`${source} is not a valid URL: ${apiBaseUrl}`);
  }

  const allowInsecure =
    process.env.ALLOW_INSECURE_REGISTRY_API_BASE_URL === "true";
  const isLocalhost =
    parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (parsed.protocol !== "https:" && !allowInsecure && !isLocalhost) {
    throw new Error(
      `${source} must be a public HTTPS backend API URL. Got ${apiBaseUrl}. Do not use the Coolify internal backend port; set REGISTRY_API_BASE_URL=https://api.usecontent.app.`,
    );
  }

  if (parsed.port === "8080" && !allowInsecure && !isLocalhost) {
    throw new Error(
      `${source} points at port 8080 (${apiBaseUrl}), which is the backend internal port and is not reachable from GitHub Actions. Set REGISTRY_API_BASE_URL=https://api.usecontent.app.`,
    );
  }

  return {
    apiBaseUrl: apiBaseUrl.replace(/\/$/, ""),
    source,
    token,
  };
}

async function verifyRegistryConnection(config: RegistryConfig) {
  const url = `${config.apiBaseUrl}/health`;
  console.log(
    `Checking deployment registry API ${url} from ${config.source} before sending deploy transactions.`,
  );
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(
      `Deployment registry API is not reachable at ${url}. GitHub Actions must use the public backend API, usually REGISTRY_API_BASE_URL=https://api.usecontent.app. Original error: ${formatFetchError(error)}`,
    );
  }

  if (!response.ok) {
    throw new Error(
      `Deployment registry API health check failed at ${url}: ${response.status} ${await response.text()}`,
    );
  }
}

async function syncDeploymentRegistry(
  input: DeploymentRegistryInput,
  config: RegistryConfig,
) {
  console.log(
    `Syncing SubscriptionManager ${input.address} on chain ${input.chainId} to ${config.apiBaseUrl}`,
  );
  let response: Response;
  try {
    response = await fetch(
      `${config.apiBaseUrl}/admin/contract-deployments`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Deployment-Registry-Token": config.token,
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
  } catch (error) {
    throw new Error(
      `Failed to reach deployment registry while syncing SubscriptionManager. Check REGISTRY_API_BASE_URL. Original error: ${formatFetchError(error)}`,
    );
  }

  if (!response.ok) {
    throw new Error(
      `Failed to sync deployment registry: ${response.status} ${await response.text()}`,
    );
  }
}

async function verifyDeploymentRegistry(
  input: DeploymentRegistryInput,
  config: RegistryConfig,
) {
  const url = `${config.apiBaseUrl}/contract-deployments/subscription-manager/${input.chainId}`;
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(
      `Failed to reach deployment registry read-back endpoint ${url}. Original error: ${formatFetchError(error)}`,
    );
  }
  if (!response.ok) {
    throw new Error(
      `Failed to read back SubscriptionManager: ${response.status} ${await response.text()}`,
    );
  }

  const payload = (await response.json()) as {
    deployment?: { address?: string } | null;
  };
  const actual = payload.deployment?.address?.toLowerCase();
  if (actual !== input.address.toLowerCase()) {
    throw new Error(
      `Registry read-back mismatch for SubscriptionManager: expected ${input.address}, got ${payload.deployment?.address ?? "null"}`,
    );
  }
  console.log(`Registry read-back ok for SubscriptionManager: ${input.address}`);
}

function formatFetchError(error: unknown): string {
  if (error instanceof Error) {
    const cause = error.cause instanceof Error ? ` Cause: ${error.cause.message}` : "";
    return `${error.message}${cause}`;
  }
  return String(error);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
