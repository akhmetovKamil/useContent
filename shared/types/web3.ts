import type { ChainId, WalletAddress } from "./common";

export type EvmAddress = WalletAddress;

export interface ExplorerAddressInput {
  address?: EvmAddress | null;
  chainId: ChainId;
}

export interface OpenSeaAssetInput {
  chainId: ChainId;
  contractAddress: EvmAddress;
  tokenId?: string;
}
