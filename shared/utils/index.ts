export function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export {
  buildExplorerAddressUrl,
  buildOpenSeaAssetUrl,
  getEvmChainMetadata,
  isNativeTokenAddress,
  isZeroAddress,
  normalizeAddressLike,
  shortenWalletAddress,
} from "./web3";
