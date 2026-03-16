import { secret } from "encore.dev/config";
import { MongoClient, type Collection } from "mongodb";
import type { NonceDoc } from "./types";

const mongoUri = secret("MongoUri");

let client: MongoClient | null = null;

async function getClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(mongoUri());
    await client.connect();
  }
  return client;
}

export async function getNoncesCollection(): Promise<Collection<NonceDoc>> {
  const c = await getClient();
  return c.db().collection<NonceDoc>("auth_nonces");
}
