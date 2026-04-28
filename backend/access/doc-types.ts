import type { ObjectId } from "mongodb";
import type { AccessPolicy } from "../domain/access";

export interface AccessPolicyPresetDoc {
  _id: ObjectId;
  authorId: ObjectId;
  name: string;
  description: string;
  policy: AccessPolicy;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
