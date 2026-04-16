import { secret } from "encore.dev/config";
import { ObjectId, type Collection, type Document } from "mongodb";
import { getDb } from "../lib/mongo";
import type {
  AuthorProfileDoc,
  PostDoc,
  ProjectDoc,
  ProjectNodeDoc,
  SubscriptionEntitlementDoc,
  SubscriptionPaymentIntentDoc,
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

export async function findPostByIdAndAuthorId(
  id: ObjectId,
  authorId: ObjectId
): Promise<PostDoc | null> {
  const posts = await getPostsCollection();
  return posts.findOne({ _id: id, authorId });
}

export async function updatePost(
  id: ObjectId,
  authorId: ObjectId,
  update: Partial<Omit<PostDoc, "_id" | "authorId" | "createdAt">>
): Promise<PostDoc | null> {
  const posts = await getPostsCollection();
  return posts.findOneAndUpdate(
    { _id: id, authorId },
    { $set: update },
    { returnDocument: "after" }
  );
}

export async function deletePost(
  id: ObjectId,
  authorId: ObjectId
): Promise<boolean> {
  const posts = await getPostsCollection();
  const result = await posts.deleteOne({ _id: id, authorId });
  return result.deletedCount === 1;
}

export async function getProjectsCollection(): Promise<Collection<ProjectDoc>> {
  await ensureIndexes();
  return getCollection<ProjectDoc>("projects");
}

export async function createProject(doc: ProjectDoc): Promise<ProjectDoc> {
  const projects = await getProjectsCollection();
  await projects.insertOne(doc);
  return doc;
}

export async function listProjectsByAuthorId(
  authorId: ObjectId
): Promise<ProjectDoc[]> {
  const projects = await getProjectsCollection();
  return projects.find({ authorId }).sort({ createdAt: -1 }).toArray();
}

export async function listPublishedProjectsByAuthorId(
  authorId: ObjectId
): Promise<ProjectDoc[]> {
  const projects = await getProjectsCollection();
  return projects
    .find({ authorId, status: "published" })
    .sort({ publishedAt: -1, createdAt: -1 })
    .toArray();
}

export async function findPublishedProjectByIdAndAuthorId(
  id: ObjectId,
  authorId: ObjectId
): Promise<ProjectDoc | null> {
  const projects = await getProjectsCollection();
  return projects.findOne({ _id: id, authorId, status: "published" });
}

export async function findProjectByIdAndAuthorId(
  id: ObjectId,
  authorId: ObjectId
): Promise<ProjectDoc | null> {
  const projects = await getProjectsCollection();
  return projects.findOne({ _id: id, authorId });
}

export async function updateProject(
  id: ObjectId,
  authorId: ObjectId,
  update: Partial<Omit<ProjectDoc, "_id" | "authorId" | "rootNodeId" | "createdAt">>
): Promise<ProjectDoc | null> {
  const projects = await getProjectsCollection();
  return projects.findOneAndUpdate(
    { _id: id, authorId },
    { $set: update },
    { returnDocument: "after" }
  );
}

export async function deleteProject(
  id: ObjectId,
  authorId: ObjectId
): Promise<boolean> {
  const projects = await getProjectsCollection();
  const result = await projects.deleteOne({ _id: id, authorId });
  return result.deletedCount === 1;
}

export async function getProjectNodesCollection(): Promise<
  Collection<ProjectNodeDoc>
> {
  await ensureIndexes();
  return getCollection<ProjectNodeDoc>("project_nodes");
}

export async function createProjectNode(
  doc: ProjectNodeDoc
): Promise<ProjectNodeDoc> {
  const projectNodes = await getProjectNodesCollection();
  await projectNodes.insertOne(doc);
  return doc;
}

export async function findProjectNodeByIdAndProjectId(
  id: ObjectId,
  projectId: ObjectId
): Promise<ProjectNodeDoc | null> {
  const projectNodes = await getProjectNodesCollection();
  return projectNodes.findOne({ _id: id, projectId });
}

export async function listProjectNodesByParent(
  projectId: ObjectId,
  parentId: ObjectId
): Promise<ProjectNodeDoc[]> {
  const projectNodes = await getProjectNodesCollection();
  return projectNodes
    .find({ projectId, parentId })
    .sort({ kind: 1, name: 1, createdAt: 1 })
    .toArray();
}

export async function listPublishedProjectNodesByParent(
  projectId: ObjectId,
  parentId: ObjectId
): Promise<ProjectNodeDoc[]> {
  const projectNodes = await getProjectNodesCollection();
  return projectNodes
    .find({ projectId, parentId, visibility: "published" })
    .sort({ kind: 1, name: 1, createdAt: 1 })
    .toArray();
}

export async function listProjectNodesByProjectId(
  projectId: ObjectId
): Promise<ProjectNodeDoc[]> {
  const projectNodes = await getProjectNodesCollection();
  return projectNodes.find({ projectId }).toArray();
}

export async function findProjectNodeChildrenRecursive(
  projectId: ObjectId,
  parentId: ObjectId
): Promise<ProjectNodeDoc[]> {
  const projectNodes = await getProjectNodesCollection();
  const children = await projectNodes.find({ projectId, parentId }).toArray();
  const all: ProjectNodeDoc[] = [...children];

  for (const child of children) {
    if (child.kind === "folder") {
      const nested = await findProjectNodeChildrenRecursive(projectId, child._id);
      all.push(...nested);
    }
  }

  return all;
}

export async function updateProjectNode(
  id: ObjectId,
  projectId: ObjectId,
  update: Partial<
    Pick<ProjectNodeDoc, "name" | "parentId" | "visibility" | "updatedAt">
  >
): Promise<ProjectNodeDoc | null> {
  const projectNodes = await getProjectNodesCollection();
  return projectNodes.findOneAndUpdate(
    { _id: id, projectId },
    { $set: update },
    { returnDocument: "after" }
  );
}

export async function deleteProjectNodes(ids: ObjectId[]): Promise<void> {
  if (!ids.length) {
    return;
  }

  const projectNodes = await getProjectNodesCollection();
  await projectNodes.deleteMany({ _id: { $in: ids } });
}

export async function deleteProjectNodesByProjectId(
  projectId: ObjectId
): Promise<void> {
  const projectNodes = await getProjectNodesCollection();
  await projectNodes.deleteMany({ projectId });
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

export async function createSubscriptionEntitlement(
  doc: Omit<SubscriptionEntitlementDoc, "_id">
): Promise<SubscriptionEntitlementDoc> {
  const entitlements = await getSubscriptionEntitlementsCollection();
  const result = await entitlements.insertOne(doc as SubscriptionEntitlementDoc);
  return { _id: result.insertedId, ...doc };
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
        status: "active",
        validUntil: input.validUntil,
        source: "onchain",
        updatedAt: input.now,
      },
      $setOnInsert: {
        createdAt: input.now,
      },
    },
    { upsert: true, returnDocument: "after" }
  ) as Promise<SubscriptionEntitlementDoc>;
}

export async function getSubscriptionPaymentIntentsCollection(): Promise<
  Collection<SubscriptionPaymentIntentDoc>
> {
  await ensureIndexes();
  return getCollection<SubscriptionPaymentIntentDoc>("subscription_payment_intents");
}

export async function createSubscriptionPaymentIntent(
  doc: Omit<SubscriptionPaymentIntentDoc, "_id">
): Promise<SubscriptionPaymentIntentDoc> {
  const intents = await getSubscriptionPaymentIntentsCollection();
  const result = await intents.insertOne(doc as SubscriptionPaymentIntentDoc);
  return { _id: result.insertedId, ...doc };
}

export async function findSubscriptionPaymentIntentByIdAndWallet(
  id: ObjectId,
  subscriberWallet: string
): Promise<SubscriptionPaymentIntentDoc | null> {
  const intents = await getSubscriptionPaymentIntentsCollection();
  return intents.findOne({ _id: id, subscriberWallet });
}

export async function findSubscriptionPaymentIntentByTxHash(
  txHash: string
): Promise<SubscriptionPaymentIntentDoc | null> {
  const intents = await getSubscriptionPaymentIntentsCollection();
  return intents.findOne({ txHash });
}

export async function updateSubscriptionPaymentIntent(
  id: ObjectId,
  update: Partial<
    Omit<SubscriptionPaymentIntentDoc, "_id" | "createdAt">
  >
): Promise<SubscriptionPaymentIntentDoc | null> {
  const intents = await getSubscriptionPaymentIntentsCollection();
  return intents.findOneAndUpdate(
    { _id: id },
    { $set: update },
    { returnDocument: "after" }
  );
}

export async function listSubscriptionPaymentIntentsByWallet(
  subscriberWallet: string
): Promise<SubscriptionPaymentIntentDoc[]> {
  const intents = await getSubscriptionPaymentIntentsCollection();
  return intents
    .find({ subscriberWallet })
    .sort({ createdAt: -1 })
    .limit(50)
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
    subscriptionPaymentIntents,
  ] = await Promise.all([
    getCollection<UserDoc>("users"),
    getCollection<AuthorProfileDoc>("author_profiles"),
    getCollection<PostDoc>("posts"),
    getCollection<ProjectDoc>("projects"),
    getCollection<ProjectNodeDoc>("project_nodes"),
    getCollection<SubscriptionPlanDoc>("subscription_plans"),
    getCollection<SubscriptionEntitlementDoc>("subscription_entitlements"),
    getCollection<SubscriptionPaymentIntentDoc>("subscription_payment_intents"),
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
    subscriptionEntitlements.createIndex(
      { authorId: 1, subscriberWallet: 1, planId: 1 },
      { unique: true }
    ),
    subscriptionEntitlements.createIndex({ planId: 1, validUntil: -1 }),
    subscriptionPaymentIntents.createIndex({ subscriberWallet: 1, createdAt: -1 }),
    subscriptionPaymentIntents.createIndex({ authorId: 1, status: 1 }),
    subscriptionPaymentIntents.createIndex(
      { txHash: 1 },
      { unique: true, sparse: true }
    ),
  ]);

  indexesReady = true;
}
