import { ObjectId, type Collection } from "mongodb";
import {
  SUBSCRIPTION_ENTITLEMENT_SOURCE,
  SUBSCRIPTION_ENTITLEMENT_STATUS,
} from "../../shared/consts";
import { ensureIndexes, getCollection } from "../storage/repository-base";
import type {
  SubscriptionEntitlementDoc,
  SubscriptionPaymentIntentDoc,
  SubscriptionPlanDoc,
} from "./doc-types";

export async function getSubscriptionPlansCollection(): Promise<
  Collection<SubscriptionPlanDoc>
> {
  await ensureIndexes();
  return getCollection<SubscriptionPlanDoc>("subscription_plans");
}

export async function findSubscriptionPlanById(
  id: ObjectId,
): Promise<SubscriptionPlanDoc | null> {
  const plans = await getSubscriptionPlansCollection();
  return plans.findOne({ _id: id });
}

export async function findSubscriptionPlanByAuthorIdAndCode(
  authorId: ObjectId,
  code: string,
): Promise<SubscriptionPlanDoc | null> {
  const plans = await getSubscriptionPlansCollection();
  return plans.findOne({ authorId, code });
}

export async function listSubscriptionPlansByAuthorId(
  authorId: ObjectId,
): Promise<SubscriptionPlanDoc[]> {
  const plans = await getSubscriptionPlansCollection();
  return plans.find({ authorId }).sort({ createdAt: -1 }).toArray();
}

export async function listActiveSubscriptionPlansByAuthorId(
  authorId: ObjectId,
): Promise<SubscriptionPlanDoc[]> {
  const plans = await getSubscriptionPlansCollection();
  return plans
    .find({ authorId, active: true })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function createSubscriptionPlan(
  doc: Omit<SubscriptionPlanDoc, "_id">,
): Promise<SubscriptionPlanDoc> {
  const plans = await getSubscriptionPlansCollection();
  const result = await plans.insertOne(doc as SubscriptionPlanDoc);
  return { _id: result.insertedId, ...doc };
}

export async function updateSubscriptionPlan(
  id: ObjectId,
  update: Partial<
    Omit<SubscriptionPlanDoc, "_id" | "authorId" | "code" | "createdAt">
  >,
): Promise<SubscriptionPlanDoc | null> {
  const plans = await getSubscriptionPlansCollection();
  return plans.findOneAndUpdate(
    { _id: id },
    { $set: update },
    { returnDocument: "after" },
  );
}

export async function deleteSubscriptionPlanByIdAndAuthorId(
  id: ObjectId,
  authorId: ObjectId,
): Promise<boolean> {
  const plans = await getSubscriptionPlansCollection();
  const result = await plans.deleteOne({ _id: id, authorId });
  return result.deletedCount === 1;
}

export async function deleteSubscriptionPlansByAuthorId(
  authorId: ObjectId,
): Promise<void> {
  const plans = await getSubscriptionPlansCollection();
  await plans.deleteMany({ authorId });
}

export async function getSubscriptionEntitlementsCollection(): Promise<
  Collection<SubscriptionEntitlementDoc>
> {
  await ensureIndexes();
  return getCollection<SubscriptionEntitlementDoc>("subscription_entitlements");
}

export async function listSubscriptionEntitlementsByWallet(
  subscriberWallet: string,
): Promise<SubscriptionEntitlementDoc[]> {
  const entitlements = await getSubscriptionEntitlementsCollection();
  return entitlements
    .find({ subscriberWallet })
    .sort({ validUntil: -1, createdAt: -1 })
    .toArray();
}

export async function listSubscriptionEntitlementsByWalletAndAuthorId(
  subscriberWallet: string,
  authorId: ObjectId,
): Promise<SubscriptionEntitlementDoc[]> {
  const entitlements = await getSubscriptionEntitlementsCollection();
  return entitlements
    .find({ subscriberWallet, authorId })
    .sort({ validUntil: -1, createdAt: -1 })
    .toArray();
}

export async function listSubscriptionEntitlementsByAuthorId(
  authorId: ObjectId,
): Promise<SubscriptionEntitlementDoc[]> {
  const entitlements = await getSubscriptionEntitlementsCollection();
  return entitlements
    .find({ authorId })
    .sort({ validUntil: -1, createdAt: -1 })
    .toArray();
}

export async function countActiveSubscriptionEntitlementsByPlanId(
  planId: ObjectId,
  now: Date,
): Promise<number> {
  const entitlements = await getSubscriptionEntitlementsCollection();
  return entitlements.countDocuments({
    planId,
    status: SUBSCRIPTION_ENTITLEMENT_STATUS.ACTIVE,
    validUntil: { $gt: now },
  });
}

export async function countActiveSubscriptionEntitlementsByPlanIds(
  planIds: ObjectId[],
  now: Date,
): Promise<number> {
  if (!planIds.length) {
    return 0;
  }

  const entitlements = await getSubscriptionEntitlementsCollection();
  const wallets = await entitlements.distinct("subscriberWallet", {
    planId: { $in: planIds },
    status: SUBSCRIPTION_ENTITLEMENT_STATUS.ACTIVE,
    validUntil: { $gt: now },
  });

  return wallets.length;
}

export async function createSubscriptionEntitlement(
  doc: Omit<SubscriptionEntitlementDoc, "_id">,
): Promise<SubscriptionEntitlementDoc> {
  const entitlements = await getSubscriptionEntitlementsCollection();
  const result = await entitlements.insertOne(
    doc as SubscriptionEntitlementDoc,
  );
  return { _id: result.insertedId, ...doc };
}

export async function deleteSubscriptionEntitlementsByAuthorId(
  authorId: ObjectId,
): Promise<void> {
  const entitlements = await getSubscriptionEntitlementsCollection();
  await entitlements.deleteMany({ authorId });
}

export async function upsertActiveSubscriptionEntitlement(input: {
  authorId: ObjectId;
  subscriberWallet: string;
  planId: ObjectId;
  validUntil: Date;
  now: Date;
}): Promise<SubscriptionEntitlementDoc> {
  const entitlements = await getSubscriptionEntitlementsCollection();
  return entitlements.findOneAndUpdate(
    {
      authorId: input.authorId,
      subscriberWallet: input.subscriberWallet,
      planId: input.planId,
    },
    {
      $set: {
        status: SUBSCRIPTION_ENTITLEMENT_STATUS.ACTIVE,
        validUntil: input.validUntil,
        source: SUBSCRIPTION_ENTITLEMENT_SOURCE.ONCHAIN,
        updatedAt: input.now,
      },
      $setOnInsert: {
        createdAt: input.now,
      },
    },
    { upsert: true, returnDocument: "after" },
  ) as Promise<SubscriptionEntitlementDoc>;
}

export async function getSubscriptionPaymentIntentsCollection(): Promise<
  Collection<SubscriptionPaymentIntentDoc>
> {
  await ensureIndexes();
  return getCollection<SubscriptionPaymentIntentDoc>(
    "subscription_payment_intents",
  );
}

export async function createSubscriptionPaymentIntent(
  doc: Omit<SubscriptionPaymentIntentDoc, "_id">,
): Promise<SubscriptionPaymentIntentDoc> {
  const intents = await getSubscriptionPaymentIntentsCollection();
  const insertDoc = { ...doc } as Partial<SubscriptionPaymentIntentDoc>;
  if (insertDoc.txHash === null) {
    delete insertDoc.txHash;
  }

  const result = await intents.insertOne(
    insertDoc as SubscriptionPaymentIntentDoc,
  );
  return { _id: result.insertedId, ...doc };
}

export async function findSubscriptionPaymentIntentByIdAndWallet(
  id: ObjectId,
  subscriberWallet: string,
): Promise<SubscriptionPaymentIntentDoc | null> {
  const intents = await getSubscriptionPaymentIntentsCollection();
  return intents.findOne({ _id: id, subscriberWallet });
}

export async function findSubscriptionPaymentIntentByTxHash(
  txHash: string,
): Promise<SubscriptionPaymentIntentDoc | null> {
  const intents = await getSubscriptionPaymentIntentsCollection();
  return intents.findOne({ txHash });
}

export async function deleteSubscriptionPaymentIntentsByAuthorId(
  authorId: ObjectId,
): Promise<void> {
  const intents = await getSubscriptionPaymentIntentsCollection();
  await intents.deleteMany({ authorId });
}

export async function updateSubscriptionPaymentIntent(
  id: ObjectId,
  update: Partial<Omit<SubscriptionPaymentIntentDoc, "_id" | "createdAt">>,
): Promise<SubscriptionPaymentIntentDoc | null> {
  const intents = await getSubscriptionPaymentIntentsCollection();
  return intents.findOneAndUpdate(
    { _id: id },
    { $set: update },
    { returnDocument: "after" },
  );
}

export async function listSubscriptionPaymentIntentsByWallet(
  subscriberWallet: string,
): Promise<SubscriptionPaymentIntentDoc[]> {
  const intents = await getSubscriptionPaymentIntentsCollection();
  return intents
    .find({ subscriberWallet })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();
}
