import { secret } from "encore.dev/config";
import { type Collection, type Document } from "mongodb";
import { getDb } from "../lib/mongo";
import type {
  AccessPolicyPresetDoc,
  AuthorPlatformCleanupLogDoc,
  AuthorPlatformSubscriptionDoc,
  AuthorProfileDoc,
  ContractDeploymentDoc,
  PlatformSubscriptionPaymentIntentDoc,
  PostAttachmentDoc,
  PostCommentDoc,
  PostReportDoc,
  PostDoc,
  PostLikeDoc,
  PostViewDoc,
  ProjectDoc,
  ProjectNodeDoc,
  SubscriptionEntitlementDoc,
  SubscriptionPaymentIntentDoc,
  SubscriptionPlanDoc,
  UserDoc,
} from "../lib/content-types";

const mongoUri = secret("MongoUri");

let indexesReady = false;

async function getRawCollection<T extends Document>(
  name: string,
): Promise<Collection<T>> {
  const db = await getDb(mongoUri());
  return db.collection<T>(name);
}

export async function getCollection<T extends Document>(
  name: string,
): Promise<Collection<T>> {
  await ensureIndexes();
  return getRawCollection<T>(name);
}

export async function ensureIndexes(): Promise<void> {
  if (indexesReady) {
    return;
  }

  const [
    users,
    authorProfiles,
    authorPlatformCleanupLogs,
    accessPolicyPresets,
    posts,
    projects,
    projectNodes,
    postAttachments,
    postLikes,
    postComments,
    postReports,
    postViews,
    subscriptionPlans,
    subscriptionEntitlements,
    subscriptionPaymentIntents,
    platformSubscriptionPaymentIntents,
    authorPlatformSubscriptions,
    contractDeployments,
  ] = await Promise.all([
    getRawCollection<UserDoc>("users"),
    getRawCollection<AuthorProfileDoc>("author_profiles"),
    getRawCollection<AuthorPlatformCleanupLogDoc>("author_platform_cleanup_logs"),
    getRawCollection<AccessPolicyPresetDoc>("access_policy_presets"),
    getRawCollection<PostDoc>("posts"),
    getRawCollection<ProjectDoc>("projects"),
    getRawCollection<ProjectNodeDoc>("project_nodes"),
    getRawCollection<PostAttachmentDoc>("post_attachments"),
    getRawCollection<PostLikeDoc>("post_likes"),
    getRawCollection<PostCommentDoc>("post_comments"),
    getRawCollection<PostReportDoc>("post_reports"),
    getRawCollection<PostViewDoc>("post_views"),
    getRawCollection<SubscriptionPlanDoc>("subscription_plans"),
    getRawCollection<SubscriptionEntitlementDoc>("subscription_entitlements"),
    getRawCollection<SubscriptionPaymentIntentDoc>("subscription_payment_intents"),
    getRawCollection<PlatformSubscriptionPaymentIntentDoc>(
      "platform_subscription_payment_intents",
    ),
    getRawCollection<AuthorPlatformSubscriptionDoc>(
      "author_platform_subscriptions",
    ),
    getRawCollection<ContractDeploymentDoc>("contract_deployments"),
  ]);

  await Promise.all([
    migrateUserIndexes(users),
    migrateSubscriptionPaymentIntentIndexes(subscriptionPaymentIntents),
  ]);

  await Promise.all([
    users.createIndex({ primaryWallet: 1 }, { unique: true }),
    users.createIndex(
      { username: 1 },
      {
        unique: true,
        partialFilterExpression: { username: { $type: "string" } },
      },
    ),
    users.createIndex({ "wallets.address": 1 }, { unique: true }),
    authorProfiles.createIndex({ slug: 1 }, { unique: true }),
    authorProfiles.createIndex({ userId: 1 }, { unique: true }),
    accessPolicyPresets.createIndex({ authorId: 1, isDefault: 1 }),
    accessPolicyPresets.createIndex({ authorId: 1, createdAt: -1 }),
    posts.createIndex({ authorId: 1, status: 1, publishedAt: -1 }),
    posts.createIndex({ status: 1, publishedAt: -1, _id: -1 }),
    posts.createIndex({ status: 1, promoted: 1, promotionStatus: 1, publishedAt: -1 }),
    posts.createIndex({ authorId: 1, accessPolicyId: 1 }),
    posts.createIndex({ authorId: 1, createdAt: -1 }),
    postAttachments.createIndex({ postId: 1, createdAt: 1 }),
    postAttachments.createIndex({ authorId: 1, createdAt: -1 }),
    postLikes.createIndex({ postId: 1, walletAddress: 1 }, { unique: true }),
    postLikes.createIndex({ walletAddress: 1, createdAt: -1 }),
    postComments.createIndex({ postId: 1, createdAt: 1 }),
    postComments.createIndex({ walletAddress: 1, createdAt: -1 }),
    postReports.createIndex(
      { postId: 1, reporterWallet: 1 },
      { unique: true },
    ),
    postReports.createIndex({ authorId: 1, status: 1, createdAt: -1 }),
    postViews.createIndex({ postId: 1, viewerKey: 1 }, { unique: true }),
    postViews.createIndex({ viewerKey: 1, createdAt: -1 }),
    projects.createIndex({ authorId: 1, status: 1, publishedAt: -1 }),
    projects.createIndex({ authorId: 1, accessPolicyId: 1 }),
    projectNodes.createIndex({ projectId: 1, parentId: 1, name: 1 }),
    projectNodes.createIndex({ projectId: 1, visibility: 1 }),
    subscriptionPlans.createIndex({ authorId: 1, code: 1 }, { unique: true }),
    subscriptionPlans.createIndex(
      { chainId: 1, planKey: 1 },
      { unique: true, partialFilterExpression: { planKey: { $exists: true } } },
    ),
    subscriptionPlans.createIndex(
      { authorId: 1, active: 1 },
      { partialFilterExpression: { active: true } },
    ),
    subscriptionEntitlements.createIndex({ authorId: 1, subscriberWallet: 1 }),
    subscriptionEntitlements.createIndex(
      { authorId: 1, subscriberWallet: 1, planId: 1 },
      { unique: true },
    ),
    subscriptionEntitlements.createIndex({ planId: 1, validUntil: -1 }),
    subscriptionPaymentIntents.createIndex({
      subscriberWallet: 1,
      createdAt: -1,
    }),
    subscriptionPaymentIntents.createIndex({ authorId: 1, status: 1 }),
    subscriptionPaymentIntents.createIndex(
      { txHash: 1 },
      {
        unique: true,
        partialFilterExpression: { txHash: { $type: "string" } },
      },
    ),
    platformSubscriptionPaymentIntents.createIndex({
      walletAddress: 1,
      createdAt: -1,
    }),
    platformSubscriptionPaymentIntents.createIndex(
      { txHash: 1 },
      {
        unique: true,
        partialFilterExpression: { txHash: { $type: "string" } },
      },
    ),
    authorPlatformSubscriptions.createIndex({ authorId: 1 }, { unique: true }),
    authorPlatformCleanupLogs.createIndex({ authorId: 1, createdAt: -1 }),
    contractDeployments.createIndex(
      { chainId: 1, contractName: 1 },
      { unique: true },
    ),
  ]);

  indexesReady = true;
}

async function migrateUserIndexes(users: Collection<UserDoc>): Promise<void> {
  await users.updateMany({ username: null }, { $unset: { username: "" } });

  try {
    await users.dropIndex("username_1");
  } catch (error) {
    if (!isMongoIndexNotFoundError(error)) {
      throw error;
    }
  }
}

async function migrateSubscriptionPaymentIntentIndexes(
  subscriptionPaymentIntents: Collection<SubscriptionPaymentIntentDoc>,
): Promise<void> {
  await subscriptionPaymentIntents.updateMany(
    { txHash: null },
    { $unset: { txHash: "" } },
  );

  try {
    await subscriptionPaymentIntents.dropIndex("txHash_1");
  } catch (error) {
    if (!isMongoIndexNotFoundError(error)) {
      throw error;
    }
  }
}

function isMongoIndexNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "codeName" in error &&
    (error as { codeName?: unknown }).codeName === "IndexNotFound"
  );
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
