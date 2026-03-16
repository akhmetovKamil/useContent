import { MongoClient, type Db } from "mongodb";

let client: MongoClient | null = null;
let cachedUri: string | null = null;

export async function getDb(mongoUri: string): Promise<Db> {
  if (!client || cachedUri !== mongoUri) {
    if (client) await client.close();
    client = new MongoClient(mongoUri);
    cachedUri = mongoUri;
    await client.connect();
  }
  return client.db();
}
