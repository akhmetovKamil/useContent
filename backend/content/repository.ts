import { secret } from "encore.dev/config";
import { ObjectId, type Collection, type Document } from "mongodb";
import { getDb } from "../lib/mongo";
import type {
  AccessPolicyPresetDoc,
  AuthorPlatformSubscriptionDoc,
  AuthorProfileDoc,
  PostCommentDoc,
  PostAttachmentDoc,
  PostDoc,
  PostLikeDoc,
  PostViewDoc,
  ProjectDoc,
  ProjectNodeDoc,
  SubscriptionEntitlementDoc,
  ContractDeploymentDoc,
  PlatformSubscriptionPaymentIntentDoc,
  SubscriptionPaymentIntentDoc,
  SubscriptionPlanDoc,
  UserDoc,
} from "./types";

const mongoUri = secret("MongoUri");

let indexesReady = false;

async function getCollection<T extends Document>(
  name: string,
): Promise<Collection<T>> {
  const db = await getDb(mongoUri());
  return db.collection<T>(name);
}

export async function getUsersCollection(): Promise<Collection<UserDoc>> {
  await ensureIndexes();
  return getCollection<UserDoc>("users");
}

export async function findUserByPrimaryWallet(
  primaryWallet: string,
): Promise<UserDoc | null> {
  const users = await getUsersCollection();
  return users.findOne({ primaryWallet });
}

export async function findUserById(id: ObjectId): Promise<UserDoc | null> {
  const users = await getUsersCollection();
  return users.findOne({ _id: id });
}

export async function createUser(doc: Omit<UserDoc, "_id">): Promise<UserDoc> {
  const users = await getUsersCollection();
  const insertDoc = { ...doc } as Partial<UserDoc>;
  if (insertDoc.username === null) {
    delete insertDoc.username;
  }

  const result = await users.insertOne(insertDoc as UserDoc);
  return { _id: result.insertedId, ...doc };
}

export async function updateUser(
  id: ObjectId,
  update: Partial<
    Omit<UserDoc, "_id" | "wallets" | "primaryWallet" | "role" | "createdAt">
  >,
): Promise<UserDoc | null> {
  const users = await getUsersCollection();
  const { username, ...restUpdate } = update;
  const setUpdate = { ...restUpdate } as typeof update;
  const unsetUpdate: Record<string, ""> = {};
  if (username === null) {
    unsetUpdate.username = "";
  } else if (username !== undefined) {
    setUpdate.username = username;
  }

  return users.findOneAndUpdate(
    { _id: id },
    {
      $set: setUpdate,
      ...(Object.keys(unsetUpdate).length ? { $unset: unsetUpdate } : {}),
    },
    { returnDocument: "after" },
  );
}

export async function getAuthorProfilesCollection(): Promise<
  Collection<AuthorProfileDoc>
> {
  await ensureIndexes();
  return getCollection<AuthorProfileDoc>("author_profiles");
}

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

export async function findAuthorProfileByUserId(
  userId: string,
): Promise<AuthorProfileDoc | null> {
  const authorProfiles = await getAuthorProfilesCollection();
  return authorProfiles.findOne({ userId });
}

export async function findAuthorProfileBySlug(
  slug: string,
): Promise<AuthorProfileDoc | null> {
  const authorProfiles = await getAuthorProfilesCollection();
  return authorProfiles.findOne({ slug });
}

export async function findAuthorProfilesByIds(
  ids: ObjectId[],
): Promise<AuthorProfileDoc[]> {
  const authorProfiles = await getAuthorProfilesCollection();
  return authorProfiles.find({ _id: { $in: ids } }).toArray();
}

export async function listAuthorProfiles(
  search?: string,
): Promise<AuthorProfileDoc[]> {
  const authorProfiles = await getAuthorProfilesCollection();
  const normalizedSearch = search?.trim();
  if (!normalizedSearch) {
    return authorProfiles.find({}).sort({ createdAt: -1 }).toArray();
  }

  const pattern = new RegExp(escapeRegExp(normalizedSearch), "i");
  return authorProfiles
    .find({
      $or: [
        { slug: pattern },
        { displayName: pattern },
        { bio: pattern },
        { tags: pattern },
      ],
    })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function createAuthorProfile(
  doc: Omit<AuthorProfileDoc, "_id">,
): Promise<AuthorProfileDoc> {
  const authorProfiles = await getAuthorProfilesCollection();
  const result = await authorProfiles.insertOne(doc as AuthorProfileDoc);
  return { _id: result.insertedId, ...doc };
}

export async function updateAuthorProfile(
  id: ObjectId,
  update: Partial<Omit<AuthorProfileDoc, "_id" | "userId" | "createdAt">>,
): Promise<AuthorProfileDoc | null> {
  const authorProfiles = await getAuthorProfilesCollection();
  return authorProfiles.findOneAndUpdate(
    { _id: id },
    { $set: update },
    { returnDocument: "after" },
  );
}

export async function deleteAuthorProfileByIdAndUserId(
  id: ObjectId,
  userId: string,
): Promise<boolean> {
  const authorProfiles = await getAuthorProfilesCollection();
  const result = await authorProfiles.deleteOne({ _id: id, userId });
  return result.deletedCount === 1;
}

export async function getAccessPolicyPresetsCollection(): Promise<
  Collection<AccessPolicyPresetDoc>
> {
  await ensureIndexes();
  return getCollection<AccessPolicyPresetDoc>("access_policy_presets");
}

export async function createAccessPolicyPreset(
  doc: Omit<AccessPolicyPresetDoc, "_id">,
): Promise<AccessPolicyPresetDoc> {
  const presets = await getAccessPolicyPresetsCollection();
  const result = await presets.insertOne(doc as AccessPolicyPresetDoc);
  return { _id: result.insertedId, ...doc };
}

export async function listAccessPolicyPresetsByAuthorId(
  authorId: ObjectId,
): Promise<AccessPolicyPresetDoc[]> {
  const presets = await getAccessPolicyPresetsCollection();
  return presets
    .find({ authorId })
    .sort({ isDefault: -1, createdAt: -1 })
    .toArray();
}

export async function findAccessPolicyPresetByIdAndAuthorId(
  id: ObjectId,
  authorId: ObjectId,
): Promise<AccessPolicyPresetDoc | null> {
  const presets = await getAccessPolicyPresetsCollection();
  return presets.findOne({ _id: id, authorId });
}

export async function updateAccessPolicyPreset(
  id: ObjectId,
  authorId: ObjectId,
  update: Partial<
    Omit<AccessPolicyPresetDoc, "_id" | "authorId" | "createdAt">
  >,
): Promise<AccessPolicyPresetDoc | null> {
  const presets = await getAccessPolicyPresetsCollection();
  return presets.findOneAndUpdate(
    { _id: id, authorId },
    { $set: update },
    { returnDocument: "after" },
  );
}

export async function clearDefaultAccessPolicyPreset(
  authorId: ObjectId,
): Promise<void> {
  const presets = await getAccessPolicyPresetsCollection();
  await presets.updateMany(
    { authorId },
    { $set: { isDefault: false, updatedAt: new Date() } },
  );
}

export async function deleteAccessPolicyPreset(
  id: ObjectId,
  authorId: ObjectId,
): Promise<boolean> {
  const presets = await getAccessPolicyPresetsCollection();
  const result = await presets.deleteOne({
    _id: id,
    authorId,
    isDefault: false,
  });
  return result.deletedCount === 1;
}

export async function deleteAccessPolicyPresetsByAuthorId(
  authorId: ObjectId,
): Promise<void> {
  const presets = await getAccessPolicyPresetsCollection();
  await presets.deleteMany({ authorId });
}

export async function getPostsCollection(): Promise<Collection<PostDoc>> {
  await ensureIndexes();
  return getCollection<PostDoc>("posts");
}

export async function createPost(doc: Omit<PostDoc, "_id">): Promise<PostDoc> {
  const posts = await getPostsCollection();
  const result = await posts.insertOne(doc as PostDoc);
  return { _id: result.insertedId, ...doc };
}

export async function listPostsByAuthorId(
  authorId: ObjectId,
  status?: PostDoc["status"],
): Promise<PostDoc[]> {
  const posts = await getPostsCollection();
  return posts
    .find(
      status ? { authorId, status } : { authorId, status: { $ne: "archived" } },
    )
    .sort({ createdAt: -1 })
    .toArray();
}

export async function listPublishedPostsByAuthorId(
  authorId: ObjectId,
): Promise<PostDoc[]> {
  const posts = await getPostsCollection();
  return posts
    .find({ authorId, status: "published" })
    .sort({ publishedAt: -1, createdAt: -1 })
    .toArray();
}

export async function countPublishedPostsByAuthorId(
  authorId: ObjectId,
): Promise<number> {
  const posts = await getPostsCollection();
  return posts.countDocuments({ authorId, status: "published" });
}

export async function listPublishedPostsByAuthorIds(
  authorIds: ObjectId[],
): Promise<PostDoc[]> {
  const posts = await getPostsCollection();
  return posts
    .find({ authorId: { $in: authorIds }, status: "published" })
    .sort({ publishedAt: -1, createdAt: -1 })
    .toArray();
}

export async function findPublishedPostByIdAndAuthorId(
  id: ObjectId,
  authorId: ObjectId,
): Promise<PostDoc | null> {
  const posts = await getPostsCollection();
  return posts.findOne({ _id: id, authorId, status: "published" });
}

export async function findPostByIdAndAuthorId(
  id: ObjectId,
  authorId: ObjectId,
): Promise<PostDoc | null> {
  const posts = await getPostsCollection();
  return posts.findOne({ _id: id, authorId });
}

export async function updatePost(
  id: ObjectId,
  authorId: ObjectId,
  update: Partial<Omit<PostDoc, "_id" | "authorId" | "createdAt">>,
): Promise<PostDoc | null> {
  const posts = await getPostsCollection();
  return posts.findOneAndUpdate(
    { _id: id, authorId },
    { $set: update },
    { returnDocument: "after" },
  );
}

export async function appendPostAttachmentId(
  id: ObjectId,
  authorId: ObjectId,
  attachmentId: ObjectId,
  updatedAt: Date,
): Promise<PostDoc | null> {
  const posts = await getPostsCollection();
  return posts.findOneAndUpdate(
    { _id: id, authorId },
    { $addToSet: { attachmentIds: attachmentId }, $set: { updatedAt } },
    { returnDocument: "after" },
  );
}

export async function deletePost(
  id: ObjectId,
  authorId: ObjectId,
): Promise<boolean> {
  const posts = await getPostsCollection();
  const result = await posts.deleteOne({ _id: id, authorId });
  return result.deletedCount === 1;
}

export async function deletePostsByAuthorId(authorId: ObjectId): Promise<void> {
  const posts = await getPostsCollection();
  await posts.deleteMany({ authorId });
}

export async function getPostLikesCollection(): Promise<
  Collection<PostLikeDoc>
> {
  await ensureIndexes();
  return getCollection<PostLikeDoc>("post_likes");
}

export async function getPostCommentsCollection(): Promise<
  Collection<PostCommentDoc>
> {
  await ensureIndexes();
  return getCollection<PostCommentDoc>("post_comments");
}

export async function getPostAttachmentsCollection(): Promise<
  Collection<PostAttachmentDoc>
> {
  await ensureIndexes();
  return getCollection<PostAttachmentDoc>("post_attachments");
}

export async function getPostViewsCollection(): Promise<
  Collection<PostViewDoc>
> {
  await ensureIndexes();
  return getCollection<PostViewDoc>("post_views");
}

export async function findPostLike(
  postId: ObjectId,
  walletAddress: string,
): Promise<PostLikeDoc | null> {
  const likes = await getPostLikesCollection();
  return likes.findOne({ postId, walletAddress });
}

export async function createPostLike(doc: PostLikeDoc): Promise<PostLikeDoc> {
  const likes = await getPostLikesCollection();
  await likes.updateOne(
    { postId: doc.postId, walletAddress: doc.walletAddress },
    { $setOnInsert: doc },
    { upsert: true },
  );
  return doc;
}

export async function deletePostLike(
  postId: ObjectId,
  walletAddress: string,
): Promise<void> {
  const likes = await getPostLikesCollection();
  await likes.deleteOne({ postId, walletAddress });
}

export async function countPostLikes(postId: ObjectId): Promise<number> {
  const likes = await getPostLikesCollection();
  return likes.countDocuments({ postId });
}

export async function countPostComments(postId: ObjectId): Promise<number> {
  const comments = await getPostCommentsCollection();
  return comments.countDocuments({ postId });
}

export async function countPostViews(postId: ObjectId): Promise<number> {
  const views = await getPostViewsCollection();
  return views.countDocuments({ postId });
}

export async function recordPostView(
  postId: ObjectId,
  viewerKey: string,
): Promise<number> {
  const now = new Date();
  const views = await getPostViewsCollection();
  await views.updateOne(
    { postId, viewerKey },
    {
      $setOnInsert: {
        _id: new ObjectId(),
        postId,
        viewerKey,
        createdAt: now,
      },
      $set: { updatedAt: now },
    },
    { upsert: true },
  );
  return countPostViews(postId);
}

export async function listPostComments(
  postId: ObjectId,
): Promise<PostCommentDoc[]> {
  const comments = await getPostCommentsCollection();
  return comments.find({ postId }).sort({ createdAt: 1 }).toArray();
}

export async function createPostComment(
  doc: PostCommentDoc,
): Promise<PostCommentDoc> {
  const comments = await getPostCommentsCollection();
  await comments.insertOne(doc);
  return doc;
}

export async function deletePostCommentsByPostId(
  postId: ObjectId,
): Promise<void> {
  const comments = await getPostCommentsCollection();
  await comments.deleteMany({ postId });
  const likes = await getPostLikesCollection();
  await likes.deleteMany({ postId });
  const views = await getPostViewsCollection();
  await views.deleteMany({ postId });
}

export async function createPostAttachment(
  doc: PostAttachmentDoc,
): Promise<PostAttachmentDoc> {
  const attachments = await getPostAttachmentsCollection();
  await attachments.insertOne(doc);
  return doc;
}

export async function listPostAttachments(
  postId: ObjectId,
): Promise<PostAttachmentDoc[]> {
  const attachments = await getPostAttachmentsCollection();
  return attachments.find({ postId }).sort({ createdAt: 1 }).toArray();
}

export async function listPostAttachmentsByAuthorId(
  authorId: ObjectId,
): Promise<PostAttachmentDoc[]> {
  const attachments = await getPostAttachmentsCollection();
  return attachments.find({ authorId }).sort({ createdAt: 1 }).toArray();
}

export async function findPostAttachmentByIdAndPostId(
  id: ObjectId,
  postId: ObjectId,
): Promise<PostAttachmentDoc | null> {
  const attachments = await getPostAttachmentsCollection();
  return attachments.findOne({ _id: id, postId });
}

export async function deletePostAttachmentsByPostId(
  postId: ObjectId,
): Promise<PostAttachmentDoc[]> {
  const attachments = await getPostAttachmentsCollection();
  const existing = await attachments.find({ postId }).toArray();
  await attachments.deleteMany({ postId });
  return existing;
}

export async function deletePostAttachmentById(
  attachment: PostAttachmentDoc,
): Promise<void> {
  const attachments = await getPostAttachmentsCollection();
  await attachments.deleteOne({ _id: attachment._id });
  const posts = await getPostsCollection();
  await posts.updateOne(
    { _id: attachment.postId, authorId: attachment.authorId },
    {
      $pull: { attachmentIds: attachment._id },
      $set: { updatedAt: new Date() },
    },
  );
}

export async function sumPostAttachmentBytesByAuthorId(
  authorId: ObjectId,
): Promise<number> {
  const attachments = await getPostAttachmentsCollection();
  const [stats] = await attachments
    .aggregate<{ totalSize: number }>([
      { $match: { authorId } },
      {
        $group: {
          _id: null,
          totalSize: { $sum: { $ifNull: ["$size", 0] } },
        },
      },
      { $project: { _id: 0, totalSize: 1 } },
    ])
    .toArray();

  return stats?.totalSize ?? 0;
}

export async function countPostsByAccessPolicyId(
  authorId: ObjectId,
  accessPolicyId: ObjectId,
): Promise<number> {
  const posts = await getPostsCollection();
  return posts.countDocuments({ authorId, accessPolicyId });
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
  authorId: ObjectId,
  status?: ProjectDoc["status"],
): Promise<ProjectDoc[]> {
  const projects = await getProjectsCollection();
  return projects
    .find(
      status ? { authorId, status } : { authorId, status: { $ne: "archived" } },
    )
    .sort({ createdAt: -1 })
    .toArray();
}

export async function listPublishedProjectsByAuthorId(
  authorId: ObjectId,
): Promise<ProjectDoc[]> {
  const projects = await getProjectsCollection();
  return projects
    .find({ authorId, status: "published" })
    .sort({ publishedAt: -1, createdAt: -1 })
    .toArray();
}

export async function findPublishedProjectByIdAndAuthorId(
  id: ObjectId,
  authorId: ObjectId,
): Promise<ProjectDoc | null> {
  const projects = await getProjectsCollection();
  return projects.findOne({ _id: id, authorId, status: "published" });
}

export async function findProjectByIdAndAuthorId(
  id: ObjectId,
  authorId: ObjectId,
): Promise<ProjectDoc | null> {
  const projects = await getProjectsCollection();
  return projects.findOne({ _id: id, authorId });
}

export async function updateProject(
  id: ObjectId,
  authorId: ObjectId,
  update: Partial<
    Omit<ProjectDoc, "_id" | "authorId" | "rootNodeId" | "createdAt">
  >,
): Promise<ProjectDoc | null> {
  const projects = await getProjectsCollection();
  return projects.findOneAndUpdate(
    { _id: id, authorId },
    { $set: update },
    { returnDocument: "after" },
  );
}

export async function deleteProject(
  id: ObjectId,
  authorId: ObjectId,
): Promise<boolean> {
  const projects = await getProjectsCollection();
  const result = await projects.deleteOne({ _id: id, authorId });
  return result.deletedCount === 1;
}

export async function deleteProjectsByAuthorId(
  authorId: ObjectId,
): Promise<void> {
  const projects = await getProjectsCollection();
  await projects.deleteMany({ authorId });
}

export async function countProjectsByAccessPolicyId(
  authorId: ObjectId,
  accessPolicyId: ObjectId,
): Promise<number> {
  const projects = await getProjectsCollection();
  return projects.countDocuments({ authorId, accessPolicyId });
}

export async function getProjectNodesCollection(): Promise<
  Collection<ProjectNodeDoc>
> {
  await ensureIndexes();
  return getCollection<ProjectNodeDoc>("project_nodes");
}

export async function createProjectNode(
  doc: ProjectNodeDoc,
): Promise<ProjectNodeDoc> {
  const projectNodes = await getProjectNodesCollection();
  await projectNodes.insertOne(doc);
  return doc;
}

export async function findProjectNodeByIdAndProjectId(
  id: ObjectId,
  projectId: ObjectId,
): Promise<ProjectNodeDoc | null> {
  const projectNodes = await getProjectNodesCollection();
  return projectNodes.findOne({ _id: id, projectId });
}

export async function listProjectNodesByParent(
  projectId: ObjectId,
  parentId: ObjectId,
): Promise<ProjectNodeDoc[]> {
  const projectNodes = await getProjectNodesCollection();
  return projectNodes
    .find({ projectId, parentId })
    .sort({ kind: 1, name: 1, createdAt: 1 })
    .toArray();
}

export async function listPublishedProjectNodesByParent(
  projectId: ObjectId,
  parentId: ObjectId,
): Promise<ProjectNodeDoc[]> {
  const projectNodes = await getProjectNodesCollection();
  return projectNodes
    .find({ projectId, parentId, visibility: "published" })
    .sort({ kind: 1, name: 1, createdAt: 1 })
    .toArray();
}

export async function listProjectNodesByProjectId(
  projectId: ObjectId,
): Promise<ProjectNodeDoc[]> {
  const projectNodes = await getProjectNodesCollection();
  return projectNodes.find({ projectId }).toArray();
}

export async function listProjectFileNodesByAuthorId(
  authorId: ObjectId,
): Promise<ProjectNodeDoc[]> {
  const projectNodes = await getProjectNodesCollection();
  return projectNodes
    .find({ authorId, kind: "file" })
    .sort({ createdAt: 1 })
    .toArray();
}

export async function getProjectNodeStats(projectId: ObjectId): Promise<{
  fileCount: number;
  folderCount: number;
  totalSize: number;
}> {
  const projectNodes = await getProjectNodesCollection();
  const [stats] = await projectNodes
    .aggregate<{
      fileCount: number;
      folderCount: number;
      totalSize: number;
    }>([
      { $match: { projectId } },
      {
        $group: {
          _id: null,
          fileCount: {
            $sum: { $cond: [{ $eq: ["$kind", "file"] }, 1, 0] },
          },
          folderCount: {
            $sum: { $cond: [{ $eq: ["$kind", "folder"] }, 1, 0] },
          },
          totalSize: {
            $sum: { $cond: [{ $eq: ["$kind", "file"] }, "$size", 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          fileCount: 1,
          folderCount: 1,
          totalSize: 1,
        },
      },
    ])
    .toArray();

  return {
    fileCount: stats?.fileCount ?? 0,
    folderCount: Math.max((stats?.folderCount ?? 0) - 1, 0),
    totalSize: stats?.totalSize ?? 0,
  };
}

export async function sumProjectFileBytesByAuthorId(
  authorId: ObjectId,
): Promise<number> {
  const projectNodes = await getProjectNodesCollection();
  const [stats] = await projectNodes
    .aggregate<{ totalSize: number }>([
      { $match: { authorId, kind: "file" } },
      {
        $group: {
          _id: null,
          totalSize: { $sum: { $ifNull: ["$size", 0] } },
        },
      },
      { $project: { _id: 0, totalSize: 1 } },
    ])
    .toArray();

  return stats?.totalSize ?? 0;
}

export async function findProjectNodeChildrenRecursive(
  projectId: ObjectId,
  parentId: ObjectId,
): Promise<ProjectNodeDoc[]> {
  const projectNodes = await getProjectNodesCollection();
  const children = await projectNodes.find({ projectId, parentId }).toArray();
  const all: ProjectNodeDoc[] = [...children];

  for (const child of children) {
    if (child.kind === "folder") {
      const nested = await findProjectNodeChildrenRecursive(
        projectId,
        child._id,
      );
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
  >,
): Promise<ProjectNodeDoc | null> {
  const projectNodes = await getProjectNodesCollection();
  return projectNodes.findOneAndUpdate(
    { _id: id, projectId },
    { $set: update },
    { returnDocument: "after" },
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
  projectId: ObjectId,
): Promise<void> {
  const projectNodes = await getProjectNodesCollection();
  await projectNodes.deleteMany({ projectId });
}

export async function deleteProjectNodesByAuthorId(
  authorId: ObjectId,
): Promise<void> {
  const projectNodes = await getProjectNodesCollection();
  await projectNodes.deleteMany({ authorId });
}

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
    status: "active",
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
    status: "active",
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
        status: "active",
        validUntil: input.validUntil,
        source: "onchain",
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

export async function getContractDeploymentsCollection(): Promise<
  Collection<ContractDeploymentDoc>
> {
  await ensureIndexes();
  return getCollection<ContractDeploymentDoc>("contract_deployments");
}

export async function findContractDeployment(
  chainId: number,
  contractName: ContractDeploymentDoc["contractName"],
): Promise<ContractDeploymentDoc | null> {
  const deployments = await getContractDeploymentsCollection();
  return deployments.findOne({ chainId, contractName });
}

export async function upsertContractDeployment(
  doc: Omit<ContractDeploymentDoc, "_id" | "createdAt" | "updatedAt">,
  now: Date,
): Promise<ContractDeploymentDoc> {
  const deployments = await getContractDeploymentsCollection();
  return deployments.findOneAndUpdate(
    { chainId: doc.chainId, contractName: doc.contractName },
    {
      $set: {
        address: doc.address,
        platformTreasury: doc.platformTreasury,
        deployedBy: doc.deployedBy,
        deploymentTxHash: doc.deploymentTxHash,
        updatedAt: now,
      },
      $setOnInsert: {
        chainId: doc.chainId,
        contractName: doc.contractName,
        createdAt: now,
      },
    },
    { upsert: true, returnDocument: "after" },
  ) as Promise<ContractDeploymentDoc>;
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

async function ensureIndexes(): Promise<void> {
  if (indexesReady) {
    return;
  }

  const [
    users,
    authorProfiles,
    accessPolicyPresets,
    posts,
    projects,
    projectNodes,
    postAttachments,
    postLikes,
    postComments,
    postViews,
    subscriptionPlans,
    subscriptionEntitlements,
    subscriptionPaymentIntents,
    platformSubscriptionPaymentIntents,
    authorPlatformSubscriptions,
    contractDeployments,
  ] = await Promise.all([
    getCollection<UserDoc>("users"),
    getCollection<AuthorProfileDoc>("author_profiles"),
    getCollection<AccessPolicyPresetDoc>("access_policy_presets"),
    getCollection<PostDoc>("posts"),
    getCollection<ProjectDoc>("projects"),
    getCollection<ProjectNodeDoc>("project_nodes"),
    getCollection<PostAttachmentDoc>("post_attachments"),
    getCollection<PostLikeDoc>("post_likes"),
    getCollection<PostCommentDoc>("post_comments"),
    getCollection<PostViewDoc>("post_views"),
    getCollection<SubscriptionPlanDoc>("subscription_plans"),
    getCollection<SubscriptionEntitlementDoc>("subscription_entitlements"),
    getCollection<SubscriptionPaymentIntentDoc>("subscription_payment_intents"),
    getCollection<PlatformSubscriptionPaymentIntentDoc>(
      "platform_subscription_payment_intents",
    ),
    getCollection<AuthorPlatformSubscriptionDoc>(
      "author_platform_subscriptions",
    ),
    getCollection<ContractDeploymentDoc>("contract_deployments"),
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
    posts.createIndex({ authorId: 1, accessPolicyId: 1 }),
    posts.createIndex({ authorId: 1, createdAt: -1 }),
    postAttachments.createIndex({ postId: 1, createdAt: 1 }),
    postAttachments.createIndex({ authorId: 1, createdAt: -1 }),
    postLikes.createIndex({ postId: 1, walletAddress: 1 }, { unique: true }),
    postLikes.createIndex({ walletAddress: 1, createdAt: -1 }),
    postComments.createIndex({ postId: 1, createdAt: 1 }),
    postComments.createIndex({ walletAddress: 1, createdAt: -1 }),
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
