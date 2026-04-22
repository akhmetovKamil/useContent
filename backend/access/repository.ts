import { ObjectId, type Collection } from "mongodb";
import { ensureIndexes, getCollection } from "../lib/repository-base";
import type { AccessPolicyPresetDoc } from "../lib/content-types";

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
