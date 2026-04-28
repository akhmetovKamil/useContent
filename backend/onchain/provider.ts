import { APIError } from "encore.dev/api";
import { JsonRpcProvider } from "ethers";

export function getProvider(chainId: number): JsonRpcProvider {
  const url =
    process.env[`RPC_URL_${chainId}`] ??
    (chainId === 11155111 ? process.env.SEPOLIA_RPC_URL : undefined);

  if (!url) {
    throw APIError.failedPrecondition(`RPC_URL_${chainId} is not configured`);
  }

  return new JsonRpcProvider(url, chainId);
}
