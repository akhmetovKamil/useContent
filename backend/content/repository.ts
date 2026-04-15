import { secret } from "encore.dev/config";
import type { Collection, Document } from "mongodb";
import { getDb } from "../lib/mongo";
import type {
  AuthorProfileDoc,
  PostDoc,
  ProjectDoc,
  ProjectNodeDoc,
  SubscriptionEntitlementDoc,
  SubscriptionPlanDoc,
  UserDoc,
} from "./types";

const mongoUri = secret("MongoUri");

let indexesReady = false;

async function getCollection<T extends Document>(
  name: string
): Promise<Collection<T>> {
  const db = await getDb(mongoUri());
  return db.collection<T>(name);
}

export async function getUsersCollection(): Promise<Collection<UserDoc>> {
  await ensureIndexes();
  return getCollection<UserDoc>("users");
}

export async function getAuthorProfilesCollection(): Promise<
  Collection<AuthorProfileDoc>
> {
  await ensureIndexes();
  return getCollection<AuthorProfileDoc>("author_profiles");
}

export async function getPostsCollection(): Promise<Collection<PostDoc>> {
  await ensureIndexes();
  return getCollection<PostDoc>("posts");
}

export async function getProjectsCollection(): Promise<Collection<ProjectDoc>> {
  await ensureIndexes();
  return getCollection<ProjectDoc>("projects");
}

export async function getProjectNodesCollection(): Promise<
  Collection<ProjectNodeDoc>
> {
  await ensureIndexes();
  return getCollection<ProjectNodeDoc>("project_nodes");
}

export async function getSubscriptionPlansCollection(): Promise<
  Collection<SubscriptionPlanDoc>
> {
  await ensureIndexes();
  return getCollection<SubscriptionPlanDoc>("subscription_plans");
}

export async function getSubscriptionEntitlementsCollection(): Promise<
  Collection<SubscriptionEntitlementDoc>
> {
  await ensureIndexes();
  return getCollection<SubscriptionEntitlementDoc>("subscription_entitlements");
}

async function ensureIndexes(): Promise<void> {
  if (indexesReady) {
    return;
  }

  const [
    users,
    authorProfiles,
    posts,
    projects,
    projectNodes,
    subscriptionPlans,
    subscriptionEntitlements,
  ] = await Promise.all([
    getCollection<UserDoc>("users"),
    getCollection<AuthorProfileDoc>("author_profiles"),
    getCollection<PostDoc>("posts"),
    getCollection<ProjectDoc>("projects"),
    getCollection<ProjectNodeDoc>("project_nodes"),
    getCollection<SubscriptionPlanDoc>("subscription_plans"),
    getCollection<SubscriptionEntitlementDoc>("subscription_entitlements"),
  ]);

  await Promise.all([
    users.createIndex({ primaryWallet: 1 }, { unique: true }),
    users.createIndex({ username: 1 }, { unique: true, sparse: true }),
    users.createIndex({ "wallets.address": 1 }, { unique: true }),
    authorProfiles.createIndex({ slug: 1 }, { unique: true }),
    authorProfiles.createIndex({ userId: 1 }, { unique: true }),
    posts.createIndex({ authorId: 1, status: 1, publishedAt: -1 }),
    posts.createIndex({ authorId: 1, createdAt: -1 }),
    projects.createIndex({ authorId: 1, status: 1, publishedAt: -1 }),
    projectNodes.createIndex({ projectId: 1, parentId: 1, name: 1 }),
    projectNodes.createIndex({ projectId: 1, visibility: 1 }),
    subscriptionPlans.createIndex({ authorId: 1, code: 1 }, { unique: true }),
    subscriptionPlans.createIndex(
      { authorId: 1, active: 1 },
      { partialFilterExpression: { active: true } }
    ),
    subscriptionEntitlements.createIndex({ authorId: 1, subscriberWallet: 1 }),
    subscriptionEntitlements.createIndex({ planId: 1, validUntil: -1 }),
  ]);

  indexesReady = true;
}
