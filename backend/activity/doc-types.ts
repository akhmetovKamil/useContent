import type { ObjectId } from "mongodb";
import type { ActivityType } from "../../shared/types/content";

export interface ActivityDoc {
  _id: ObjectId;
  type: ActivityType;
  targetWallet: string;
  actorWallet: string | null;
  authorId: ObjectId | null;
  authorSlug: string | null;
  authorDisplayName: string | null;
  postId: ObjectId | null;
  postTitle: string | null;
  message: string;
  dedupeKey: string | null;
  createdAt: Date;
  readAt: Date | null;
}
