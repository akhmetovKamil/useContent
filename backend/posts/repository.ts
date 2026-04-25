import { ObjectId, type Collection } from "mongodb";
import { ensureIndexes, escapeRegExp, getCollection } from "../storage/repository-base";
import type {
  PostAttachmentDoc,
  PostCommentDoc,
  PostDoc,
  PostLikeDoc,
  PostReportDoc,
  PostViewDoc,
} from "../lib/content-types";

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

export interface PublishedPostCursor {
  publishedAt: Date;
  id: ObjectId;
}

export interface PublishedPostPageOptions {
  authorId?: ObjectId;
  authorIds?: ObjectId[];
  cursor?: PublishedPostCursor | null;
  limit: number;
  search?: string;
}

export async function listPublishedPostsPage({
  authorId,
  authorIds,
  cursor,
  limit,
  search,
}: PublishedPostPageOptions): Promise<PostDoc[]> {
  const posts = await getPostsCollection();
  const authorFilter =
    authorId !== undefined
      ? { authorId }
      : authorIds !== undefined
        ? { authorId: { $in: authorIds } }
        : {};
  const cursorFilter = cursor
    ? {
        $or: [
          { publishedAt: { $lt: cursor.publishedAt } },
          { publishedAt: cursor.publishedAt, _id: { $lt: cursor.id } },
        ],
      }
    : {};
  const normalizedSearch = search?.trim();
  const searchFilter = normalizedSearch
    ? {
        $or: [
          { title: new RegExp(escapeRegExp(normalizedSearch), "i") },
          { content: new RegExp(escapeRegExp(normalizedSearch), "i") },
        ],
      }
    : {};

  return posts
    .find({
      ...authorFilter,
      ...cursorFilter,
      ...searchFilter,
      status: "published",
      publishedAt: { $ne: null },
    })
    .sort({ publishedAt: -1, _id: -1 })
    .limit(limit)
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

export async function getPostReportsCollection(): Promise<
  Collection<PostReportDoc>
> {
  await ensureIndexes();
  return getCollection<PostReportDoc>("post_reports");
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

export async function listPostCommentsPreview(
  postId: ObjectId,
  limit: number,
): Promise<PostCommentDoc[]> {
  const comments = await getPostCommentsCollection();
  const recent = await comments
    .find({ postId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return recent.reverse();
}

export async function createPostComment(
  doc: PostCommentDoc,
): Promise<PostCommentDoc> {
  const comments = await getPostCommentsCollection();
  await comments.insertOne(doc);
  return doc;
}

export async function findPostReport(
  postId: ObjectId,
  reporterWallet: string,
): Promise<PostReportDoc | null> {
  const reports = await getPostReportsCollection();
  return reports.findOne({ postId, reporterWallet });
}

export async function createPostReport(
  doc: PostReportDoc,
): Promise<PostReportDoc> {
  const reports = await getPostReportsCollection();
  await reports.insertOne(doc);
  return doc;
}

export async function deletePostCommentsByPostId(
  postId: ObjectId,
): Promise<void> {
  const comments = await getPostCommentsCollection();
  await comments.deleteMany({ postId });
  const reports = await getPostReportsCollection();
  await reports.deleteMany({ postId });
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
