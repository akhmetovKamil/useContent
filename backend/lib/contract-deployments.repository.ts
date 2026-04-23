import { type Collection } from "mongodb";
import { ensureIndexes, getCollection } from "../storage/repository-base";
import type { ContractDeploymentDoc } from "./content-types";

export async function getContractDeploymentsCollection(): Promise<
  Collection<ContractDeploymentDoc>
> {
  await ensureIndexes();
  return getCollection<ContractDeploymentDoc>("contract_deployments");
}

export async function findContractDeployment(
  chainId: number,
  contractName: ContractDeploymentDoc["contractName"],
): Promise<ContractDeploymentDoc | null> {
  const deployments = await getContractDeploymentsCollection();
  return deployments.findOne({ chainId, contractName });
}

export async function upsertContractDeployment(
  doc: Omit<ContractDeploymentDoc, "_id" | "createdAt" | "updatedAt">,
  now: Date,
): Promise<ContractDeploymentDoc> {
  const deployments = await getContractDeploymentsCollection();
  return deployments.findOneAndUpdate(
    { chainId: doc.chainId, contractName: doc.contractName },
    {
      $set: {
        address: doc.address,
        platformTreasury: doc.platformTreasury,
        deployedBy: doc.deployedBy,
        deploymentTxHash: doc.deploymentTxHash,
        updatedAt: now,
      },
      $setOnInsert: {
        chainId: doc.chainId,
        contractName: doc.contractName,
        createdAt: now,
      },
    },
    { upsert: true, returnDocument: "after" },
  ) as Promise<ContractDeploymentDoc>;
}
