import type { ObjectId } from "mongodb";
import type { AccessPolicy } from "../domain/access";

export interface UserWalletDoc {
  address: string;
  kind: "primary" | "secondary";
  addedAt: Date;
}

export interface UserDoc {
  _id: ObjectId;
  username: string | null;
  displayName: string;
  bio: string;
  avatarFileId: ObjectId | null;
  primaryWallet: string;
  wallets: UserWalletDoc[];
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthorProfileDoc {
  _id: ObjectId;
  userId: string;
  slug: string;
  displayName: string;
  bio: string;
  tags: string[];
  avatarFileId: ObjectId | null;
  defaultPolicy: AccessPolicy;
  defaultPolicyId: ObjectId | null;
  subscriptionPlanId: ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}
