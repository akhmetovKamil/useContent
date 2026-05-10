import { Interface } from "ethers";
import { platformStorageManagerAbi } from "../../shared/abi/platform-storage-manager.abi";
import { platformTierManagerAbi } from "../../shared/abi/platform-tier-manager.abi";
import { subscriptionManagerAbi } from "../../shared/abi/subscription-manager.abi";

export const subscriptionManagerInterface = new Interface(
  subscriptionManagerAbi,
);

export const platformTierManagerInterface = new Interface(platformTierManagerAbi);

export const platformStorageManagerInterface = new Interface(
  platformStorageManagerAbi,
);

export const erc20ReadAbi = [
  "function balanceOf(address account) view returns (uint256)",
] as const;

export const erc721ReadAbi = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
] as const;

export const erc1155ReadAbi = [
  "function balanceOf(address account,uint256 id) view returns (uint256)",
] as const;
