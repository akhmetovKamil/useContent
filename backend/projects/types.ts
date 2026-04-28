import type { Header } from "encore.dev/api";
import type {
  CreateProjectFolderRequest,
  UpdateProjectNodeRequest,
  UpdateProjectRequest,
} from "../lib/content-types";

export * from "../lib/content-types";

export interface ListMyProjectsRequest {
  status?: "draft" | "published" | "archived";
}

export interface ProjectIdPathRequest {
  projectId: string;
}

export type UpdateProjectPathRequest = UpdateProjectRequest &
  ProjectIdPathRequest;

export interface ListProjectNodesRequest {
  projectId: string;
  parentId?: string | null;
}

export type CreateProjectFolderPathRequest = CreateProjectFolderRequest &
  ProjectIdPathRequest;

export type UpdateProjectNodePathRequest = UpdateProjectNodeRequest & {
  projectId: string;
  nodeId: string;
};

export interface ProjectNodePathRequest {
  projectId: string;
  nodeId: string;
}

export interface ProjectBundlePathRequest {
  projectId: string;
  folderId?: string | null;
}

export interface ListAuthorProjectsRequest {
  slug: string;
  authorization?: Header<"Authorization">;
}

export interface GetAuthorProjectRequest {
  slug: string;
  projectId: string;
  authorization?: Header<"Authorization">;
}

export interface ListAuthorProjectNodesRequest {
  slug: string;
  projectId: string;
  parentId?: string | null;
  authorization?: Header<"Authorization">;
}

export interface AuthorProjectBundlePathRequest {
  slug: string;
  projectId: string;
  folderId?: string | null;
  authorization?: Header<"Authorization">;
}
