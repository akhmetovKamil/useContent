import { ObjectId } from "mongodb";
import type { ActivityType } from "../../shared/types/content";
import { normalizeWallet, shortenWallet } from "../lib/utils/wallet";
import type { PostDoc } from "../posts/doc-types";
import type { AuthorProfileDoc } from "../profiles/doc-types";
import * as profilesRepo from "../profiles/repository";
import * as subscriptionsRepo from "../subscriptions/repository";
import * as activityRepo from "./repository";

interface ActivityAuthorContext {
  author: AuthorProfileDoc;
  ownerWallet: string | null;
}

export async function recordPostLikedActivity(
  post: PostDoc,
  actorWallet: string,
): Promise<void> {
  const context = await getActivityAuthorContext(post.authorId);
  if (!context?.ownerWallet) {
    return;
  }
  await createActivity({
    actorWallet,
    author: context.author,
    dedupeKey: `post_liked:${post._id.toHexString()}:${normalizeWallet(actorWallet)}`,
    message: `${shortenWallet(actorWallet)} liked "${post.title}".`,
    post,
    targetWallet: context.ownerWallet,
    type: "post_liked",
  });
}

export async function recordPostCommentedActivity(
  post: PostDoc,
  actorWallet: string,
): Promise<void> {
  const context = await getActivityAuthorContext(post.authorId);
  if (!context?.ownerWallet) {
    return;
  }
  await createActivity({
    actorWallet,
    author: context.author,
    dedupeKey: null,
    message: `${shortenWallet(actorWallet)} commented on "${post.title}".`,
    post,
    targetWallet: context.ownerWallet,
    type: "post_commented",
  });
}

export async function recordNewPostActivity(post: PostDoc): Promise<void> {
  const context = await getActivityAuthorContext(post.authorId);
  if (!context) {
    return;
  }
  const entitlements =
    await subscriptionsRepo.listSubscriptionEntitlementsByAuthorId(
      post.authorId,
    );
  const now = Date.now();
  const targetWallets = [
    ...new Set(
      entitlements
        .filter(
          (entitlement) =>
            entitlement.status === "active" &&
            entitlement.validUntil.getTime() > now,
        )
        .map((entitlement) => entitlement.subscriberWallet),
    ),
  ];

  await Promise.all(
    targetWallets.map((targetWallet) =>
      createActivity({
        actorWallet: context.ownerWallet,
        author: context.author,
        dedupeKey: `new_post:${post._id.toHexString()}:${targetWallet}`,
        message: `${context.author.displayName} published "${post.title}".`,
        post,
        targetWallet,
        type: "new_post",
      }),
    ),
  );
}

export async function recordNewSubscriptionActivity({
  authorId,
  planCode,
  subscriberWallet,
}: {
  authorId: ObjectId;
  planCode: string;
  subscriberWallet: string;
}): Promise<void> {
  const context = await getActivityAuthorContext(authorId);
  if (!context?.ownerWallet) {
    return;
  }
  await createActivity({
    actorWallet: subscriberWallet,
    author: context.author,
    dedupeKey: `new_subscription:${authorId.toHexString()}:${normalizeWallet(subscriberWallet)}:${planCode}`,
    message: `${shortenWallet(subscriberWallet)} subscribed to ${planCode}.`,
    post: null,
    targetWallet: context.ownerWallet,
    type: "new_subscription",
  });
}

async function createActivity({
  actorWallet,
  author,
  dedupeKey,
  message,
  post,
  targetWallet,
  type,
}: {
  actorWallet: string | null;
  author: AuthorProfileDoc;
  dedupeKey: string | null;
  message: string;
  post: PostDoc | null;
  targetWallet: string;
  type: ActivityType;
}) {
  const normalizedTarget = normalizeWallet(targetWallet);
  const normalizedActor = actorWallet ? normalizeWallet(actorWallet) : null;
  if (normalizedActor && normalizedActor === normalizedTarget) {
    return;
  }
  await activityRepo.createActivity({
    type,
    targetWallet: normalizedTarget,
    actorWallet: normalizedActor,
    authorId: author._id,
    authorSlug: author.slug,
    authorDisplayName: author.displayName,
    postId: post?._id ?? null,
    postTitle: post?.title ?? null,
    message,
    dedupeKey,
    createdAt: new Date(),
    readAt: null,
  });
}

async function getActivityAuthorContext(
  authorId: ObjectId,
): Promise<ActivityAuthorContext | null> {
  const [author] = await profilesRepo.findAuthorProfilesByIds([authorId]);
  if (!author) {
    return null;
  }

  const user = await profilesRepo.findUserById(new ObjectId(author.userId));
  return {
    author,
    ownerWallet: user?.primaryWallet ?? null,
  };
}
