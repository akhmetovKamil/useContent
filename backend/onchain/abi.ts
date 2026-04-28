import { Interface } from "ethers";
import { platformSubscriptionManagerAbi } from "../../shared/abi/platform-subscription-manager.abi";
import { subscriptionManagerAbi } from "../../shared/abi/subscription-manager.abi";

export const subscriptionManagerInterface = new Interface(
  subscriptionManagerAbi,
);

export const platformSubscriptionManagerInterface = new Interface(
  platformSubscriptionManagerAbi,
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
