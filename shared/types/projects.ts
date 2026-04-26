import type { AccessPolicy, AccessPolicyInput, PolicyMode } from "./access";
import type {
  ContentStatus,
  ContentVisibility,
  ProjectNodeKind,
} from "../consts";
import type {
  ContentBaseDto,
  EntityId,
  Maybe,
  StorageSizedDto,
} from "./common";

export interface ProjectDto extends ContentBaseDto {
  description: string;
  status: ContentStatus;
  policyMode: PolicyMode;
  policy: Maybe<AccessPolicy>;
  accessPolicyId: Maybe<EntityId>;
  rootNodeId: EntityId;
  fileCount: number;
  folderCount: number;
  totalSize: number;
}

export interface FeedProjectDto extends ProjectDto {
  authorSlug: string;
  authorDisplayName: string;
  accessLabel: Maybe<string>;
  hasAccess: boolean;
}

export interface ProjectNodeDto {
  id: EntityId;
  authorId: EntityId;
  projectId: EntityId;
  parentId: Maybe<EntityId>;
  kind: ProjectNodeKind;
  name: string;
  storageKey: Maybe<string>;
  mimeType: Maybe<string>;
  size: Maybe<number>;
  visibility: ContentVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectNodeListDto {
  nodes: ProjectNodeDto[];
  currentFolderId: EntityId;
  breadcrumbs: ProjectNodeDto[];
}

export interface ProjectBundleItemDto extends StorageSizedDto {
  nodeId: EntityId;
  name: string;
  path: string;
  mimeType: Maybe<string>;
}

export interface ProjectBundleDto {
  folderId: EntityId;
  files: ProjectBundleItemDto[];
  fileCount: number;
  folderCount: number;
  totalSize: number;
}

export interface CreateProjectInput {
  title: string;
  description?: string;
  status?: ContentStatus;
  policyMode?: PolicyMode;
  policy?: Maybe<AccessPolicy>;
  policyInput?: AccessPolicyInput;
  accessPolicyId?: Maybe<EntityId>;
}

export type UpdateProjectInput = Partial<CreateProjectInput>;

export interface CreateProjectFolderInput {
  name: string;
  parentId?: Maybe<EntityId>;
  visibility?: ContentVisibility;
}

export interface UpdateProjectNodeInput {
  name?: string;
  parentId?: Maybe<EntityId>;
  visibility?: ContentVisibility;
}
