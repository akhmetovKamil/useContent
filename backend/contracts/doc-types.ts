import type { ObjectId } from "mongodb";

export interface ContractDeploymentDoc {
  _id: ObjectId;
  chainId: number;
  contractName: "SubscriptionManager" | "PlatformSubscriptionManager";
  address: string;
  platformTreasury: string;
  deployedBy: string;
  deploymentTxHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}
