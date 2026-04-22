import { api, type Header } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import {
  getOptionalViewerWallet,
  parseFilePath,
  readRequestBody,
  writeFileResponse,
} from "../lib/api-helpers";
import * as service from "./service";
import type {
  CreateProjectFolderRequest,
  CreateProjectRequest,
  FeedProjectResponse,
  ProjectBundleResponse,
  ProjectNodeListResponse,
  ProjectNodeResponse,
  ProjectResponse,
  UpdateProjectNodeRequest,
  UpdateProjectRequest,
} from "./types";

interface ListMyProjectsRequest {
  status?: "draft" | "published" | "archived";
}

export const createMyProject = api(
  { method: "POST", path: "/me/projects", expose: true, auth: true },
  async (req: CreateProjectRequest): Promise<ProjectResponse> => {
    const auth = getAuthData()!;
    const project = await service.createMyProject(auth.walletAddress, req);
    return service.buildProjectResponse(project);
  },
);

export const listMyProjects = api(
  { method: "GET", path: "/me/projects", expose: true, auth: true },
  async ({
    status,
  }: ListMyProjectsRequest): Promise<{ projects: ProjectResponse[] }> => {
    const auth = getAuthData()!;
    const projects =
      status === "archived"
        ? await service.listMyArchivedProjects(auth.walletAddress)
        : await service.listMyProjects(auth.walletAddress);
    return {
      projects: await Promise.all(projects.map(service.buildProjectResponse)),
    };
  },
);

export const updateMyProject = api(
  {
    method: "PATCH",
    path: "/me/projects/:projectId",
    expose: true,
    auth: true,
  },
  async ({
    projectId,
    ...req
  }: UpdateProjectRequest & {
    projectId: string;
  }): Promise<ProjectResponse> => {
    const auth = getAuthData()!;
    const project = await service.updateMyProject(
      auth.walletAddress,
      projectId,
      req,
    );
    return service.buildProjectResponse(project);
  },
);

export const deleteMyProject = api(
  {
    method: "DELETE",
    path: "/me/projects/:projectId",
    expose: true,
    auth: true,
  },
  async ({ projectId }: { projectId: string }): Promise<void> => {
    const auth = getAuthData()!;
    await service.deleteMyProject(auth.walletAddress, projectId);
  },
);

interface ListProjectNodesRequest {
  projectId: string;
  parentId?: string | null;
}

export const listMyProjectNodes = api(
  {
    method: "GET",
    path: "/me/project-nodes",
    expose: true,
    auth: true,
  },
  async ({
    projectId,
    parentId,
  }: ListProjectNodesRequest): Promise<ProjectNodeListResponse> => {
    const auth = getAuthData()!;
    return service.listMyProjectNodes(auth.walletAddress, projectId, parentId);
  },
);

export const createMyProjectFolder = api(
  {
    method: "POST",
    path: "/me/project-folders",
    expose: true,
    auth: true,
  },
  async ({
    projectId,
    ...req
  }: CreateProjectFolderRequest & {
    projectId: string;
  }): Promise<ProjectNodeResponse> => {
    const auth = getAuthData()!;
    const folder = await service.createMyProjectFolder(
      auth.walletAddress,
      projectId,
      req,
    );
    return service.toProjectNodeResponse(folder);
  },
);

export const updateMyProjectNode = api(
  {
    method: "PATCH",
    path: "/me/project-nodes/:nodeId",
    expose: true,
    auth: true,
  },
  async ({
    projectId,
    nodeId,
    ...req
  }: UpdateProjectNodeRequest & {
    projectId: string;
    nodeId: string;
  }): Promise<ProjectNodeResponse> => {
    const auth = getAuthData()!;
    const node = await service.updateMyProjectNode(
      auth.walletAddress,
      projectId,
      nodeId,
      req,
    );
    return service.toProjectNodeResponse(node);
  },
);

export const deleteMyProjectNode = api(
  {
    method: "DELETE",
    path: "/me/project-nodes/:nodeId",
    expose: true,
    auth: true,
  },
  async ({
    projectId,
    nodeId,
  }: {
    projectId: string;
    nodeId: string;
  }): Promise<void> => {
    const auth = getAuthData()!;
    await service.deleteMyProjectNode(auth.walletAddress, projectId, nodeId);
  },
);

export const getMyProjectBundle = api(
  {
    method: "GET",
    path: "/me/project-bundle",
    expose: true,
    auth: true,
  },
  async ({
    projectId,
    folderId,
  }: {
    projectId: string;
    folderId?: string | null;
  }): Promise<ProjectBundleResponse> => {
    const auth = getAuthData()!;
    return service.getMyProjectBundle(auth.walletAddress, projectId, folderId);
  },
);

export const uploadMyProjectFile = api.raw(
  {
    method: "POST",
    path: "/me/project-files/upload/*projectId",
    expose: true,
    auth: true,
  },
  async (req, resp) => {
    const auth = getAuthData()!;
    const url = new URL(req.url ?? "", "http://localhost");
    const projectId = url.pathname.replace("/me/project-files/upload/", "");
    const name = url.searchParams.get("name") ?? "";
    const parentId = url.searchParams.get("parentId");
    const body = await readRequestBody(req);
    const contentType = String(
      req.headers["content-type"] ?? "application/octet-stream",
    );
    const node = await service.uploadMyProjectFile(
      auth.walletAddress,
      projectId,
      {
        parentId,
        name,
        body,
        contentType,
      },
    );

    resp.writeHead(200, { "Content-Type": "application/json" });
    resp.end(JSON.stringify(service.toProjectNodeResponse(node)));
  },
);

export const downloadMyProjectFile = api.raw(
  {
    method: "GET",
    path: "/me/project-files/download/*path",
    expose: true,
    auth: true,
  },
  async (req, resp) => {
    const auth = getAuthData()!;
    const [projectId, nodeId] = parseFilePath(
      req.url ?? "",
      "/me/project-files/download/",
    );
    const file = await service.getMyProjectFile(
      auth.walletAddress,
      projectId,
      nodeId,
    );
    writeFileResponse(resp, file);
  },
);

interface ListAuthorProjectsRequest {
  slug: string;
  authorization?: Header<"Authorization">;
}

export const listAuthorProjects = api(
  { method: "GET", path: "/authors/:slug/projects", expose: true },
  async ({
    slug,
    authorization,
  }: ListAuthorProjectsRequest): Promise<{
    projects: FeedProjectResponse[];
  }> => {
    const viewerWallet = await getOptionalViewerWallet(authorization);
    const projects = await service.listAuthorProjectsBySlug(slug, viewerWallet);
    return { projects };
  },
);

interface GetAuthorProjectRequest {
  slug: string;
  projectId: string;
  authorization?: Header<"Authorization">;
}

export const getAuthorProject = api(
  { method: "GET", path: "/authors/:slug/projects/:projectId", expose: true },
  async ({
    slug,
    projectId,
    authorization,
  }: GetAuthorProjectRequest): Promise<ProjectResponse> => {
    const viewerWallet = await getOptionalViewerWallet(authorization);
    const project = await service.getAuthorProjectBySlugAndId(
      slug,
      projectId,
      viewerWallet,
    );
    return service.buildProjectResponse(project);
  },
);

interface ListAuthorProjectNodesRequest {
  slug: string;
  projectId: string;
  parentId?: string | null;
  authorization?: Header<"Authorization">;
}

export const listAuthorProjectNodes = api(
  {
    method: "GET",
    path: "/author-project-nodes",
    expose: true,
  },
  async ({
    slug,
    projectId,
    parentId,
    authorization,
  }: ListAuthorProjectNodesRequest): Promise<ProjectNodeListResponse> => {
    const viewerWallet = await getOptionalViewerWallet(authorization);
    return service.listAuthorProjectNodesBySlug(
      slug,
      projectId,
      parentId,
      viewerWallet,
    );
  },
);

export const getAuthorProjectBundle = api(
  {
    method: "GET",
    path: "/author-project-bundle",
    expose: true,
  },
  async ({
    slug,
    projectId,
    folderId,
    authorization,
  }: {
    slug: string;
    projectId: string;
    folderId?: string | null;
    authorization?: Header<"Authorization">;
  }): Promise<ProjectBundleResponse> => {
    const viewerWallet = await getOptionalViewerWallet(authorization);
    return service.getAuthorProjectBundleBySlug(
      slug,
      projectId,
      folderId,
      viewerWallet,
    );
  },
);

export const downloadAuthorProjectFile = api.raw(
  {
    method: "GET",
    path: "/project-files/download/*path",
    expose: true,
  },
  async (req, resp) => {
    const [slug, projectId, nodeId] = parseFilePath(
      req.url ?? "",
      "/project-files/download/",
    );
    const viewerWallet = await getOptionalViewerWallet(
      String(req.headers.authorization ?? ""),
    );
    const file = await service.getAuthorProjectFileBySlug(
      slug,
      projectId,
      nodeId,
      viewerWallet,
    );
    writeFileResponse(resp, file);
  },
);
