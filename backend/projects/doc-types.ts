import type { ObjectId } from "mongodb";
import type { AccessPolicy, PolicyMode } from "../domain/access";
import type { ContentStatus } from "../../shared/types/content";

export interface ProjectDoc {
  _id: ObjectId;
  authorId: ObjectId;
  title: string;
  description: string;
  status: ContentStatus;
  policyMode: PolicyMode;
  policy: AccessPolicy | null;
  accessPolicyId: ObjectId | null;
  rootNodeId: ObjectId;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectNodeDoc {
  _id: ObjectId;
  authorId: ObjectId;
  projectId: ObjectId;
  parentId: ObjectId | null;
  kind: "file" | "folder";
  name: string;
  storageKey: string | null;
  mimeType: string | null;
  size: number | null;
  visibility: "author" | "published";
  createdAt: Date;
  updatedAt: Date;
}
