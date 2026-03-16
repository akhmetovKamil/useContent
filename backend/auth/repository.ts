import { secret } from "encore.dev/config";
import type { Collection } from "mongodb";
import { getDb } from "../lib/mongo";
import type { NonceDoc } from "./types";

const mongoUri = secret("MongoUri");

async function getCollection(): Promise<Collection<NonceDoc>> {
  const db = await getDb(mongoUri());
  return db.collection<NonceDoc>("auth_nonces");
}

export async function upsertNonce(address: string, nonce: string, expiresAt: Date): Promise<void> {
  const col = await getCollection();

  // Ensure MongoDB TTL index exists (idempotent — Mongo ignores duplicate index creation)
  await col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  await col.updateOne(
    { address },
    { $set: { nonce, expiresAt } },
    { upsert: true }
  );
}

export async function findNonce(address: string): Promise<NonceDoc | null> {
  const col = await getCollection();
  return col.findOne({ address });
}

export async function deleteNonce(address: string): Promise<void> {
  const col = await getCollection();
  await col.deleteOne({ address });
}
