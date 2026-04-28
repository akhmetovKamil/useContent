import { api } from "encore.dev/api";
import {
  getOptionalViewerWallet,
  getRequiredWallet,
  parseFilePath,
  readRequestBody,
  writeFileResponse,
} from "../lib/api-helpers";
import * as service from "./service";
import type {
  AuthorProjectBundlePathRequest,
  CreateProjectFolderPathRequest,
  CreateProjectFolderRequest,
  CreateProjectRequest,
  FeedProjectResponse,
  GetAuthorProjectRequest,
  ListAuthorProjectNodesRequest,
  ListAuthorProjectsRequest,
  ListMyProjectsRequest,
  ListProjectNodesRequest,
  ProjectBundlePathRequest,
  ProjectBundleResponse,
  ProjectIdPathRequest,
  ProjectNodeListResponse,
  ProjectNodePathRequest,
  ProjectNodeResponse,
  ProjectResponse,
  UpdateProjectNodePathRequest,
  UpdateProjectPathRequest,
} from "./types";
import type {
  ListAuthorProjectsResponseDto,
  ListProjectsResponseDto,
} from "../../shared/types/content";

export const createMyProject = api(
  { method: "POST", path: "/me/projects", expose: true, auth: true },
  async (req: CreateProjectRequest): Promise<ProjectResponse> => {
    const walletAddress = getRequiredWallet();
    const project = await service.createMyProject(walletAddress, req);
    return service.buildProjectResponse(project);
  },
);

export const listMyProjects = api(
  { method: "GET", path: "/me/projects", expose: true, auth: true },
  async ({
    status,
  }: ListMyProjectsRequest): Promise<ListProjectsResponseDto> => {
    const walletAddress = getRequiredWallet();
    const projects =
      status === "archived"
        ? await service.listMyArchivedProjects(walletAddress)
        : await service.listMyProjects(walletAddress);
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
  }: UpdateProjectPathRequest): Promise<ProjectResponse> => {
    const walletAddress = getRequiredWallet();
    const project = await service.updateMyProject(
      walletAddress,
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
  async ({ projectId }: ProjectIdPathRequest): Promise<void> => {
    const walletAddress = getRequiredWallet();
    await service.deleteMyProject(walletAddress, projectId);
  },
);

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
    const walletAddress = getRequiredWallet();
    return service.listMyProjectNodes(walletAddress, projectId, parentId);
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
  }: CreateProjectFolderPathRequest): Promise<ProjectNodeResponse> => {
    const walletAddress = getRequiredWallet();
    const folder = await service.createMyProjectFolder(
      walletAddress,
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
  }: UpdateProjectNodePathRequest): Promise<ProjectNodeResponse> => {
    const walletAddress = getRequiredWallet();
    const node = await service.updateMyProjectNode(
      walletAddress,
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
  }: ProjectNodePathRequest): Promise<void> => {
    const walletAddress = getRequiredWallet();
    await service.deleteMyProjectNode(walletAddress, projectId, nodeId);
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
  }: ProjectBundlePathRequest): Promise<ProjectBundleResponse> => {
    const walletAddress = getRequiredWallet();
    return service.getMyProjectBundle(walletAddress, projectId, folderId);
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
    const walletAddress = getRequiredWallet();
    const url = new URL(req.url ?? "", "http://localhost");
    const projectId = url.pathname.replace("/me/project-files/upload/", "");
    const name = url.searchParams.get("name") ?? "";
    const parentId = url.searchParams.get("parentId");
    const body = await readRequestBody(req);
    const contentType = String(
      req.headers["content-type"] ?? "application/octet-stream",
    );
    const node = await service.uploadMyProjectFile(
      walletAddress,
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
    const walletAddress = getRequiredWallet();
    const [projectId, nodeId] = parseFilePath(
      req.url ?? "",
      "/me/project-files/download/",
    );
    const file = await service.getMyProjectFile(
      walletAddress,
      projectId,
      nodeId,
    );
    writeFileResponse(resp, file);
  },
);

export const listAuthorProjects = api(
  { method: "GET", path: "/authors/:slug/projects", expose: true },
  async ({
    slug,
    authorization,
  }: ListAuthorProjectsRequest): Promise<ListAuthorProjectsResponseDto> => {
    const viewerWallet = await getOptionalViewerWallet(authorization);
    const projects = await service.listAuthorProjectsBySlug(slug, viewerWallet);
    return { projects };
  },
);

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
  }: AuthorProjectBundlePathRequest): Promise<ProjectBundleResponse> => {
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
