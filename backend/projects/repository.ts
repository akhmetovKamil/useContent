import { ObjectId, type Collection } from "mongodb";
import { ensureIndexes, getCollection } from "../lib/repository-base";
import type { ProjectDoc, ProjectNodeDoc } from "../lib/content-types";

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
