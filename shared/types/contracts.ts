import type { BaseEntityDto, Maybe, WalletAddress } from "./common";

export interface ContractDeploymentDto extends BaseEntityDto {
  chainId: number;
  contractName: "SubscriptionManager" | "PlatformSubscriptionManager";
  address: WalletAddress;
  platformTreasury: WalletAddress;
  deployedBy: WalletAddress;
  deploymentTxHash: Maybe<string>;
}

export interface ContractDeploymentLookupDto {
  deployment: Maybe<ContractDeploymentDto>;
}

export interface UpsertContractDeploymentInput {
  chainId: number;
  contractName: "SubscriptionManager" | "PlatformSubscriptionManager";
  address: WalletAddress;
  platformTreasury: WalletAddress;
  deployedBy: WalletAddress;
  deploymentTxHash?: Maybe<string>;
}
