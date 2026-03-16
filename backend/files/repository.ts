import { ObjectId } from "mongodb";
import { getFilesCollection } from "./db";
import type { FileDoc } from "./types";

let indexesCreated = false;

async function ensureIndexes(): Promise<void> {
  if (indexesCreated) return;
  const col = await getFilesCollection();
  await col.createIndex({ walletAddress: 1, parentId: 1 });
  await col.createIndex({ walletAddress: 1, type: 1 });
  indexesCreated = true;
}

export async function createFile(
  data: Omit<FileDoc, "_id" | "createdAt" | "updatedAt">
): Promise<FileDoc> {
  await ensureIndexes();
  const col = await getFilesCollection();
  const now = new Date();
  const doc = { ...data, createdAt: now, updatedAt: now } as Omit<FileDoc, "_id">;
  const result = await col.insertOne(doc as FileDoc);
  return { _id: result.insertedId, ...doc } as FileDoc;
}

export async function findById(id: string): Promise<FileDoc | null> {
  const col = await getFilesCollection();
  return col.findOne({ _id: new ObjectId(id) });
}

export async function listByParent(
  walletAddress: string,
  parentId: ObjectId | null
): Promise<FileDoc[]> {
  await ensureIndexes();
  const col = await getFilesCollection();
  return col.find({ walletAddress, parentId }).toArray();
}

export async function deleteById(id: string): Promise<void> {
  const col = await getFilesCollection();
  await col.deleteOne({ _id: new ObjectId(id) });
}

export async function findChildrenRecursive(
  walletAddress: string,
  parentId: ObjectId
): Promise<FileDoc[]> {
  const col = await getFilesCollection();
  const children = await col.find({ walletAddress, parentId }).toArray();
  const all: FileDoc[] = [...children];
  for (const child of children) {
    if (child.type === "folder") {
      const nested = await findChildrenRecursive(walletAddress, child._id);
      all.push(...nested);
    }
  }
  return all;
}

export async function updateFile(
  id: string,
  update: Partial<Pick<FileDoc, "name" | "parentId" | "storageKey">>
): Promise<FileDoc | null> {
  const col = await getFilesCollection();
  const result = await col.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...update, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  return result;
}
