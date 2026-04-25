import { ObjectId, type Collection } from "mongodb";
import { ensureIndexes, getCollection } from "../storage/repository-base";
import type { ActivityDoc } from "../lib/content-types";

export interface ActivityCursor {
  createdAt: Date;
  id: ObjectId;
}

export async function getActivitiesCollection(): Promise<Collection<ActivityDoc>> {
  await ensureIndexes();
  return getCollection<ActivityDoc>("activities");
}

export async function createActivity(
  doc: Omit<ActivityDoc, "_id">,
): Promise<ActivityDoc> {
  const activities = await getActivitiesCollection();
  const insertDoc = { ...doc } as Partial<ActivityDoc>;
  if (insertDoc.dedupeKey === null) {
    delete insertDoc.dedupeKey;
  }
  const result = await activities.updateOne(
    doc.dedupeKey ? { dedupeKey: doc.dedupeKey } : { _id: new ObjectId() },
    { $setOnInsert: insertDoc },
    { upsert: true },
  );
  const insertedId = result.upsertedId ?? new ObjectId();
  return { _id: insertedId, ...doc };
}

export async function listActivitiesByWalletPage({
  cursor,
  limit,
  targetWallet,
}: {
  cursor?: ActivityCursor | null;
  limit: number;
  targetWallet: string;
}): Promise<ActivityDoc[]> {
  const activities = await getActivitiesCollection();
  const cursorFilter = cursor
    ? {
        $or: [
          { createdAt: { $lt: cursor.createdAt } },
          { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
        ],
      }
    : {};

  return activities
    .find({ targetWallet, ...cursorFilter })
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .toArray();
}
