import type { ObjectId } from "mongodb";
import type { ContractName } from "../../shared/consts";

export interface ContractDeploymentDoc {
  _id: ObjectId;
  chainId: number;
  contractName: ContractName;
  address: string;
  platformTreasury: string;
  deployedBy: string;
  deploymentTxHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}
