import { ObjectId, type Collection } from "mongodb";
import { ensureIndexes, escapeRegExp, getCollection } from "../lib/repository-base";
import type { AuthorProfileDoc, UserDoc } from "../lib/content-types";

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
