import { ObjectId, type Collection } from "mongodb";
import { ensureIndexes, getCollection } from "../storage/repository-base";
import type { AuthorPlatformCleanupLogDoc, AuthorPlatformSubscriptionDoc, PlatformSubscriptionPaymentIntentDoc } from "../lib/content-types";

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
        extraStorageBytes: doc.extraStorageBytes,
        totalStorageBytes: doc.totalStorageBytes,
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


export async function getPlatformSubscriptionPaymentIntentsCollection(): Promise<
  Collection<PlatformSubscriptionPaymentIntentDoc>
> {
  await ensureIndexes();
  return getCollection<PlatformSubscriptionPaymentIntentDoc>(
    "platform_subscription_payment_intents",
  );
}

export async function createPlatformSubscriptionPaymentIntent(
  doc: Omit<PlatformSubscriptionPaymentIntentDoc, "_id">,
): Promise<PlatformSubscriptionPaymentIntentDoc> {
  const intents = await getPlatformSubscriptionPaymentIntentsCollection();
  const insertDoc = { ...doc } as Partial<PlatformSubscriptionPaymentIntentDoc>;
  if (insertDoc.txHash === null) {
    delete insertDoc.txHash;
  }

  const result = await intents.insertOne(
    insertDoc as PlatformSubscriptionPaymentIntentDoc,
  );
  return { _id: result.insertedId, ...doc };
}

export async function findPlatformSubscriptionPaymentIntentByIdAndWallet(
  id: ObjectId,
  walletAddress: string,
): Promise<PlatformSubscriptionPaymentIntentDoc | null> {
  const intents = await getPlatformSubscriptionPaymentIntentsCollection();
  return intents.findOne({ _id: id, walletAddress });
}

export async function findPlatformSubscriptionPaymentIntentByTxHash(
  txHash: string,
): Promise<PlatformSubscriptionPaymentIntentDoc | null> {
  const intents = await getPlatformSubscriptionPaymentIntentsCollection();
  return intents.findOne({ txHash });
}

export async function updatePlatformSubscriptionPaymentIntent(
  id: ObjectId,
  update: Partial<
    Omit<PlatformSubscriptionPaymentIntentDoc, "_id" | "createdAt">
  >,
): Promise<PlatformSubscriptionPaymentIntentDoc | null> {
  const intents = await getPlatformSubscriptionPaymentIntentsCollection();
  return intents.findOneAndUpdate(
    { _id: id },
    { $set: update },
    { returnDocument: "after" },
  );
}
