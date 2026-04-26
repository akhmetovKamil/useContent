import {
  FALLBACK_EVM_CHAIN_METADATA,
  SUPPORTED_EVM_CHAIN_METADATA,
  ZERO_ADDRESS,
} from "../consts";
import type { ExplorerAddressInput, OpenSeaAssetInput } from "../types/web3";

export function normalizeAddressLike(address: string): string {
  return address.trim().toLowerCase();
}

export function isZeroAddress(address?: string | null): boolean {
  return normalizeAddressLike(address ?? ZERO_ADDRESS) === ZERO_ADDRESS;
}

export function isNativeTokenAddress(address?: string | null): boolean {
  return isZeroAddress(address);
}

export function shortenWalletAddress(walletAddress: string, prefix = 6, suffix = 4): string {
  if (walletAddress.length <= prefix + suffix + 3) {
    return walletAddress;
  }

  return `${walletAddress.slice(0, prefix)}...${walletAddress.slice(-suffix)}`;
}

export function getEvmChainMetadata(chainId: number) {
  return (
    SUPPORTED_EVM_CHAIN_METADATA.find((chain) => chain.id === chainId) ??
    FALLBACK_EVM_CHAIN_METADATA
  );
}

export function buildExplorerAddressUrl({ address, chainId }: ExplorerAddressInput): string {
  const chain = getEvmChainMetadata(chainId);
  if (!address || isZeroAddress(address)) {
    return chain.explorerUrl;
  }

  return `${chain.explorerUrl}/address/${address}`;
}

export function buildOpenSeaAssetUrl({
  chainId,
  contractAddress,
  tokenId,
}: OpenSeaAssetInput): string | null {
  const chain = getEvmChainMetadata(chainId);
  const slug = chain.testnetOpenSeaSlug ?? chain.openSeaSlug;
  if (!slug) {
    return null;
  }

  const host = chain.testnetOpenSeaSlug ? "https://testnets.opensea.io" : "https://opensea.io";
  const assetPath = tokenId ? `${contractAddress}/${tokenId}` : contractAddress;

  return `${host}/assets/${slug}/${assetPath}`;
}
