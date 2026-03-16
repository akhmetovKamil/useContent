import type { NonceDoc } from "./types";
import { getNoncesCollection } from "./db";

export async function upsertNonce(address: string, nonce: string, expiresAt: Date): Promise<void> {
  const col = await getNoncesCollection();

  // Ensure MongoDB TTL index exists (idempotent — Mongo ignores duplicate index creation)
  await col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  await col.updateOne(
    { address },
    { $set: { nonce, expiresAt } },
    { upsert: true }
  );
}

export async function findNonce(address: string): Promise<NonceDoc | null> {
  const col = await getNoncesCollection();
  return col.findOne({ address });
}

export async function deleteNonce(address: string): Promise<void> {
  const col = await getNoncesCollection();
  await col.deleteOne({ address });
}
