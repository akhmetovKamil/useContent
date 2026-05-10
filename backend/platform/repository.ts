import { ObjectId, type Collection } from "mongodb";
import { ensureIndexes, getCollection } from "../storage/repository-base";
import type {
  AuthorPlatformCleanupLogDoc,
  AuthorPlatformSubscriptionDoc,
  AuthorPlatformStorageSubscriptionDoc,
  PlatformStoragePaymentIntentDoc,
  PlatformTierPaymentIntentDoc,
} from "./doc-types";

export async function getAuthorPlatformSubscriptionsCollection(): Promise<
  Collection<AuthorPlatformSubscriptionDoc>
> {
  await ensureIndexes();
  return getCollection<AuthorPlatformSubscriptionDoc>(
    "author_platform_subscriptions",
  );
}

export async function findAuthorPlatformSubscriptionByAuthorId(
  authorId: ObjectId,
): Promise<AuthorPlatformSubscriptionDoc | null> {
  const subscriptions = await getAuthorPlatformSubscriptionsCollection();
  return subscriptions.findOne({ authorId });
}

export async function updateAuthorPlatformSubscriptionByAuthorId(
  authorId: ObjectId,
  update: Partial<
    Pick<
      AuthorPlatformSubscriptionDoc,
      "cleanupScheduledAt" | "lastCleanupAt" | "updatedAt"
    >
  >,
): Promise<void> {
  const subscriptions = await getAuthorPlatformSubscriptionsCollection();
  await subscriptions.updateOne({ authorId }, { $set: update });
}

export async function upsertAuthorPlatformSubscription(
  doc: Omit<AuthorPlatformSubscriptionDoc, "_id" | "createdAt" | "updatedAt">,
  now: Date,
): Promise<AuthorPlatformSubscriptionDoc> {
  const subscriptions = await getAuthorPlatformSubscriptionsCollection();
  return subscriptions.findOneAndUpdate(
    { authorId: doc.authorId },
    {
      $set: {
        walletAddress: doc.walletAddress,
        planCode: doc.planCode,
        status: doc.status,
        baseStorageBytes: doc.baseStorageBytes,
        features: doc.features,
        validUntil: doc.validUntil,
        graceUntil: doc.graceUntil,
        cleanupScheduledAt: doc.cleanupScheduledAt,
        lastCleanupAt: doc.lastCleanupAt,
        lastTxHash: doc.lastTxHash,
        updatedAt: now,
      },
      $setOnInsert: {
        authorId: doc.authorId,
        createdAt: now,
      },
    },
    { upsert: true, returnDocument: "after" },
  ) as Promise<AuthorPlatformSubscriptionDoc>;
}

export async function getAuthorPlatformStorageSubscriptionsCollection(): Promise<
  Collection<AuthorPlatformStorageSubscriptionDoc>
> {
  await ensureIndexes();
  return getCollection<AuthorPlatformStorageSubscriptionDoc>(
    "author_platform_storage_subscriptions",
  );
}

export async function findAuthorPlatformStorageSubscriptionByAuthorId(
  authorId: ObjectId,
): Promise<AuthorPlatformStorageSubscriptionDoc | null> {
  const subscriptions = await getAuthorPlatformStorageSubscriptionsCollection();
  return subscriptions.findOne({ authorId });
}

export async function upsertAuthorPlatformStorageSubscription(
  doc: Omit<
    AuthorPlatformStorageSubscriptionDoc,
    "_id" | "createdAt" | "updatedAt"
  >,
  now: Date,
): Promise<AuthorPlatformStorageSubscriptionDoc> {
  const subscriptions = await getAuthorPlatformStorageSubscriptionsCollection();
  return subscriptions.findOneAndUpdate(
    { authorId: doc.authorId },
    {
      $set: {
        walletAddress: doc.walletAddress,
        status: doc.status,
        extraStorageBytes: doc.extraStorageBytes,
        validUntil: doc.validUntil,
        graceUntil: doc.graceUntil,
        lastTxHash: doc.lastTxHash,
        updatedAt: now,
      },
      $setOnInsert: {
        authorId: doc.authorId,
        createdAt: now,
      },
    },
    { upsert: true, returnDocument: "after" },
  ) as Promise<AuthorPlatformStorageSubscriptionDoc>;
}

export async function getAuthorPlatformCleanupLogsCollection(): Promise<
  Collection<AuthorPlatformCleanupLogDoc>
> {
  await ensureIndexes();
  return getCollection<AuthorPlatformCleanupLogDoc>(
    "author_platform_cleanup_logs",
  );
}

export async function createAuthorPlatformCleanupLog(
  doc: Omit<AuthorPlatformCleanupLogDoc, "_id">,
): Promise<AuthorPlatformCleanupLogDoc> {
  const logs = await getAuthorPlatformCleanupLogsCollection();
  const result = await logs.insertOne(doc as AuthorPlatformCleanupLogDoc);
  return { _id: result.insertedId, ...doc };
}


export async function getPlatformTierPaymentIntentsCollection(): Promise<
  Collection<PlatformTierPaymentIntentDoc>
> {
  await ensureIndexes();
  return getCollection<PlatformTierPaymentIntentDoc>(
    "platform_tier_payment_intents",
  );
}

export async function createPlatformTierPaymentIntent(
  doc: Omit<PlatformTierPaymentIntentDoc, "_id">,
): Promise<PlatformTierPaymentIntentDoc> {
  const intents = await getPlatformTierPaymentIntentsCollection();
  const insertDoc = { ...doc } as Partial<PlatformTierPaymentIntentDoc>;
  if (insertDoc.txHash === null) {
    delete insertDoc.txHash;
  }

  const result = await intents.insertOne(
    insertDoc as PlatformTierPaymentIntentDoc,
  );
  return { _id: result.insertedId, ...doc };
}

export async function findPlatformTierPaymentIntentByIdAndWallet(
  id: ObjectId,
  walletAddress: string,
): Promise<PlatformTierPaymentIntentDoc | null> {
  const intents = await getPlatformTierPaymentIntentsCollection();
  return intents.findOne({ _id: id, walletAddress });
}

export async function findPlatformTierPaymentIntentByTxHash(
  txHash: string,
): Promise<PlatformTierPaymentIntentDoc | null> {
  const intents = await getPlatformTierPaymentIntentsCollection();
  return intents.findOne({ txHash });
}

export async function updatePlatformTierPaymentIntent(
  id: ObjectId,
  update: Partial<Omit<PlatformTierPaymentIntentDoc, "_id" | "createdAt">>,
): Promise<PlatformTierPaymentIntentDoc | null> {
  const intents = await getPlatformTierPaymentIntentsCollection();
  return intents.findOneAndUpdate(
    { _id: id },
    { $set: update },
    { returnDocument: "after" },
  );
}

export async function getPlatformStoragePaymentIntentsCollection(): Promise<
  Collection<PlatformStoragePaymentIntentDoc>
> {
  await ensureIndexes();
  return getCollection<PlatformStoragePaymentIntentDoc>(
    "platform_storage_payment_intents",
  );
}

export async function createPlatformStoragePaymentIntent(
  doc: Omit<PlatformStoragePaymentIntentDoc, "_id">,
): Promise<PlatformStoragePaymentIntentDoc> {
  const intents = await getPlatformStoragePaymentIntentsCollection();
  const insertDoc = { ...doc } as Partial<PlatformStoragePaymentIntentDoc>;
  if (insertDoc.txHash === null) {
    delete insertDoc.txHash;
  }

  const result = await intents.insertOne(
    insertDoc as PlatformStoragePaymentIntentDoc,
  );
  return { _id: result.insertedId, ...doc };
}

export async function findPlatformStoragePaymentIntentByIdAndWallet(
  id: ObjectId,
  walletAddress: string,
): Promise<PlatformStoragePaymentIntentDoc | null> {
  const intents = await getPlatformStoragePaymentIntentsCollection();
  return intents.findOne({ _id: id, walletAddress });
}

export async function findPlatformStoragePaymentIntentByTxHash(
  txHash: string,
): Promise<PlatformStoragePaymentIntentDoc | null> {
  const intents = await getPlatformStoragePaymentIntentsCollection();
  return intents.findOne({ txHash });
}

export async function updatePlatformStoragePaymentIntent(
  id: ObjectId,
  update: Partial<Omit<PlatformStoragePaymentIntentDoc, "_id" | "createdAt">>,
): Promise<PlatformStoragePaymentIntentDoc | null> {
  const intents = await getPlatformStoragePaymentIntentsCollection();
  return intents.findOneAndUpdate(
    { _id: id },
    { $set: update },
    { returnDocument: "after" },
  );
}
