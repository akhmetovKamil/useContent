import { secret } from "encore.dev/config";
import { ObjectId, type Collection, type Document } from "mongodb";
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

export async function findUserByPrimaryWallet(
  primaryWallet: string
): Promise<UserDoc | null> {
  const users = await getUsersCollection();
  return users.findOne({ primaryWallet });
}

export async function createUser(
  doc: Omit<UserDoc, "_id">
): Promise<UserDoc> {
  const users = await getUsersCollection();
  const result = await users.insertOne(doc as UserDoc);
  return { _id: result.insertedId, ...doc };
}

export async function updateUser(
  id: ObjectId,
  update: Partial<Omit<UserDoc, "_id" | "wallets" | "primaryWallet" | "role" | "createdAt">>
): Promise<UserDoc | null> {
  const users = await getUsersCollection();
  return users.findOneAndUpdate(
    { _id: id },
    { $set: update },
    { returnDocument: "after" }
  );
}

export async function getAuthorProfilesCollection(): Promise<
  Collection<AuthorProfileDoc>
> {
  await ensureIndexes();
  return getCollection<AuthorProfileDoc>("author_profiles");
}

export async function findAuthorProfileByUserId(
  userId: string
): Promise<AuthorProfileDoc | null> {
  const authorProfiles = await getAuthorProfilesCollection();
  return authorProfiles.findOne({ userId });
}

export async function findAuthorProfileBySlug(
  slug: string
): Promise<AuthorProfileDoc | null> {
  const authorProfiles = await getAuthorProfilesCollection();
  return authorProfiles.findOne({ slug });
}

export async function createAuthorProfile(
  doc: Omit<AuthorProfileDoc, "_id">
): Promise<AuthorProfileDoc> {
  const authorProfiles = await getAuthorProfilesCollection();
  const result = await authorProfiles.insertOne(doc as AuthorProfileDoc);
  return { _id: result.insertedId, ...doc };
}

export async function updateAuthorProfile(
  id: ObjectId,
  update: Partial<Omit<AuthorProfileDoc, "_id" | "userId" | "createdAt">>
): Promise<AuthorProfileDoc | null> {
  const authorProfiles = await getAuthorProfilesCollection();
  return authorProfiles.findOneAndUpdate(
    { _id: id },
    { $set: update },
    { returnDocument: "after" }
  );
}

export async function getPostsCollection(): Promise<Collection<PostDoc>> {
  await ensureIndexes();
  return getCollection<PostDoc>("posts");
}

export async function createPost(
  doc: Omit<PostDoc, "_id">
): Promise<PostDoc> {
  const posts = await getPostsCollection();
  const result = await posts.insertOne(doc as PostDoc);
  return { _id: result.insertedId, ...doc };
}

export async function listPostsByAuthorId(
  authorId: ObjectId
): Promise<PostDoc[]> {
  const posts = await getPostsCollection();
  return posts.find({ authorId }).sort({ createdAt: -1 }).toArray();
}

export async function listPublishedPostsByAuthorId(
  authorId: ObjectId
): Promise<PostDoc[]> {
  const posts = await getPostsCollection();
  return posts
    .find({ authorId, status: "published" })
    .sort({ publishedAt: -1, createdAt: -1 })
    .toArray();
}

export async function findPublishedPostByIdAndAuthorId(
  id: ObjectId,
  authorId: ObjectId
): Promise<PostDoc | null> {
  const posts = await getPostsCollection();
  return posts.findOne({ _id: id, authorId, status: "published" });
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

export async function findSubscriptionPlanById(
  id: ObjectId
): Promise<SubscriptionPlanDoc | null> {
  const plans = await getSubscriptionPlansCollection();
  return plans.findOne({ _id: id });
}

export async function findSubscriptionPlanByAuthorIdAndCode(
  authorId: ObjectId,
  code: string
): Promise<SubscriptionPlanDoc | null> {
  const plans = await getSubscriptionPlansCollection();
  return plans.findOne({ authorId, code });
}

export async function createSubscriptionPlan(
  doc: Omit<SubscriptionPlanDoc, "_id">
): Promise<SubscriptionPlanDoc> {
  const plans = await getSubscriptionPlansCollection();
  const result = await plans.insertOne(doc as SubscriptionPlanDoc);
  return { _id: result.insertedId, ...doc };
}

export async function updateSubscriptionPlan(
  id: ObjectId,
  update: Partial<
    Omit<SubscriptionPlanDoc, "_id" | "authorId" | "code" | "createdAt">
  >
): Promise<SubscriptionPlanDoc | null> {
  const plans = await getSubscriptionPlansCollection();
  return plans.findOneAndUpdate(
    { _id: id },
    { $set: update },
    { returnDocument: "after" }
  );
}

export async function getSubscriptionEntitlementsCollection(): Promise<
  Collection<SubscriptionEntitlementDoc>
> {
  await ensureIndexes();
  return getCollection<SubscriptionEntitlementDoc>("subscription_entitlements");
}

export async function listSubscriptionEntitlementsByWallet(
  subscriberWallet: string
): Promise<SubscriptionEntitlementDoc[]> {
  const entitlements = await getSubscriptionEntitlementsCollection();
  return entitlements
    .find({ subscriberWallet })
    .sort({ validUntil: -1, createdAt: -1 })
    .toArray();
}

export async function listSubscriptionEntitlementsByWalletAndAuthorId(
  subscriberWallet: string,
  authorId: ObjectId
): Promise<SubscriptionEntitlementDoc[]> {
  const entitlements = await getSubscriptionEntitlementsCollection();
  return entitlements
    .find({ subscriberWallet, authorId })
    .sort({ validUntil: -1, createdAt: -1 })
    .toArray();
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
