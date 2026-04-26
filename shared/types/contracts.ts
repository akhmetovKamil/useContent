import type { ChainId, BaseEntityDto, Maybe, WalletAddress } from "./common";
import type { ContractName } from "../consts";

export interface ContractDeploymentDto extends BaseEntityDto {
  chainId: ChainId;
  contractName: ContractName;
  address: WalletAddress;
  platformTreasury: WalletAddress;
  deployedBy: WalletAddress;
  deploymentTxHash: Maybe<string>;
}

export interface ContractDeploymentLookupDto {
  deployment: Maybe<ContractDeploymentDto>;
}

export interface UpsertContractDeploymentInput {
  chainId: ChainId;
  contractName: ContractName;
  address: WalletAddress;
  platformTreasury: WalletAddress;
  deployedBy: WalletAddress;
  deploymentTxHash?: Maybe<string>;
}
