import { api, APIError, Header } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { validateToken } from "../auth/auth.service";
import * as service from "./files.service";
import { toResponse } from "./files.service";
import type {
  CreateFolderRequest,
  CreateProjectFolderRequest,
  FileResponse,
  ListFilesRequest,
  ListFilesResponse,
  DeleteFileRequest,
  ListProjectNodesRequest,
  ProjectNodeResponse,
  ProjectNodeRouteRequest,
  PublicListProjectNodesRequest,
  UpdateFileRequest,
  UpdateProjectNodeRequest,
} from "./types";

export const createFolder = api(
  { method: "POST", path: "/files/folder", expose: true, auth: true },
  async (req: CreateFolderRequest): Promise<FileResponse> => {
    const auth = getAuthData()!;
    const doc = await service.createFolder(
      auth.walletAddress,
      req.name,
      req.parentId
    );
    return toResponse(doc);
  }
);

export const listFiles = api(
  { method: "GET", path: "/files/list", expose: true, auth: true },
  async (req: ListFilesRequest): Promise<ListFilesResponse> => {
    const auth = getAuthData()!;
    const parentId = req.parentId ?? null;
    const docs = await service.listFiles(auth.walletAddress, parentId);
    return { files: docs.map(toResponse) };
  }
);

export const uploadFile = api.raw(
  { method: "POST", path: "/files/upload/*key", expose: true, auth: true },
  async (req, resp) => {
    const auth = getAuthData()!;
    const key = req.url!.replace("/files/upload/", "").split("?")[0];
    if (!key) {
      resp.writeHead(400, { "Content-Type": "application/json" });
      resp.end(JSON.stringify({ error: "file name is required" }));
      return;
    }

    const url = new URL(req.url!, `http://${req.headers.host}`);
    const parentId = url.searchParams.get("parentId") || null;

    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const body = Buffer.concat(chunks);
    const contentType = req.headers["content-type"] || "application/octet-stream";

    try {
      const doc = await service.uploadFile(
        auth.walletAddress,
        key,
        parentId,
        body,
        contentType
      );
      resp.writeHead(200, { "Content-Type": "application/json" });
      resp.end(JSON.stringify(toResponse(doc)));
    } catch (err: any) {
      console.error("upload error:", err);
      resp.writeHead(500, { "Content-Type": "application/json" });
      resp.end(JSON.stringify({ error: "upload failed", detail: err?.message }));
    }
  }
);

export const downloadFile = api.raw(
  { method: "GET", path: "/files/download/:id", expose: true, auth: true },
  async (req, resp) => {
    const auth = getAuthData()!;
    const id = req.url!.replace("/files/download/", "").split("?")[0];
    if (!id) {
      resp.writeHead(400, { "Content-Type": "application/json" });
      resp.end(JSON.stringify({ error: "id is required" }));
      return;
    }

    try {
      const { body, contentType, name } = await service.downloadFile(
        auth.walletAddress,
        id
      );
      resp.writeHead(200, {
        "Content-Type": contentType,
        "Content-Length": String(body.length),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(name)}"`,
      });
      resp.end(body);
    } catch (err: any) {
      if (err.message === "not_found") {
        resp.writeHead(404, { "Content-Type": "application/json" });
        resp.end(JSON.stringify({ error: "file not found" }));
      } else if (err.message === "not_a_file") {
        resp.writeHead(400, { "Content-Type": "application/json" });
        resp.end(JSON.stringify({ error: "not a file" }));
      } else {
        throw err;
      }
    }
  }
);

export const deleteFile = api(
  { method: "DELETE", path: "/files/:id", expose: true, auth: true },
  async (req: DeleteFileRequest): Promise<void> => {
    const auth = getAuthData()!;
    try {
      await service.deleteFileOrFolder(auth.walletAddress, req.id);
    } catch (err: any) {
      if (err.message === "not_found") {
        throw APIError.notFound("file or folder not found");
      }
      throw err;
    }
  }
);

export const updateFile = api(
  { method: "PATCH", path: "/files/:id", expose: true, auth: true },
  async (req: UpdateFileRequest): Promise<FileResponse> => {
    const auth = getAuthData()!;
    try {
      const doc = await service.updateFileOrFolder(auth.walletAddress, req.id, {
        name: req.name,
        parentId: req.parentId,
      });
      return toResponse(doc);
    } catch (err: any) {
      if (err.message === "not_found") {
        throw APIError.notFound("file or folder not found");
      }
      throw err;
    }
  }
);

export const listMyProjectNodes = api(
  { method: "GET", path: "/me/projects/:projectId/nodes", expose: true, auth: true },
  async (req: ListProjectNodesRequest): Promise<{ nodes: ProjectNodeResponse[] }> => {
    const auth = getAuthData()!;
    const nodes = await service.listMyProjectNodes(
      auth.walletAddress,
      req.projectId,
      req.parentId
    );
    return { nodes: nodes.map(service.toProjectNodeResponse) };
  }
);

export const createMyProjectFolder = api(
  { method: "POST", path: "/me/projects/:projectId/folders", expose: true, auth: true },
  async ({
    projectId,
    ...req
  }: CreateProjectFolderRequest & { projectId: string }): Promise<ProjectNodeResponse> => {
    const auth = getAuthData()!;
    const node = await service.createMyProjectFolder(auth.walletAddress, projectId, req);
    return service.toProjectNodeResponse(node);
  }
);

export const uploadMyProjectFile = api.raw(
  { method: "POST", path: "/me/projects/:projectId/files/*fileName", expose: true, auth: true },
  async (req, resp) => {
    const auth = getAuthData()!;
    const parsed = parseProjectFileUploadUrl(req.url!, req.headers.host);
    const body = await readRequestBody(req);
    const contentType = req.headers["content-type"] || "application/octet-stream";

    try {
      const node = await service.uploadMyProjectFile(auth.walletAddress, parsed.projectId, {
        fileName: parsed.fileName,
        parentId: parsed.parentId,
        body,
        contentType: String(contentType),
        visibility: parsed.visibility,
      });
      writeJson(resp, 200, service.toProjectNodeResponse(node));
    } catch (error) {
      writeApiError(resp, error);
    }
  }
);

export const updateMyProjectNode = api(
  { method: "PATCH", path: "/me/projects/:projectId/nodes/:nodeId", expose: true, auth: true },
  async ({
    projectId,
    nodeId,
    ...req
  }: UpdateProjectNodeRequest & ProjectNodeRouteRequest): Promise<ProjectNodeResponse> => {
    const auth = getAuthData()!;
    const node = await service.updateMyProjectNode(
      auth.walletAddress,
      projectId,
      nodeId,
      req
    );
    return service.toProjectNodeResponse(node);
  }
);

export const deleteMyProjectNode = api(
  { method: "DELETE", path: "/me/projects/:projectId/nodes/:nodeId", expose: true, auth: true },
  async ({ projectId, nodeId }: ProjectNodeRouteRequest): Promise<void> => {
    const auth = getAuthData()!;
    await service.deleteMyProjectNode(auth.walletAddress, projectId, nodeId);
  }
);

export const downloadMyProjectNode = api.raw(
  { method: "GET", path: "/me/projects/:projectId/nodes/:nodeId/download", expose: true, auth: true },
  async (req, resp) => {
    const auth = getAuthData()!;
    const { projectId, nodeId } = parseProjectNodeDownloadUrl(
      req.url!,
      "/me/projects/"
    );

    try {
      const file = await service.downloadMyProjectFile(
        auth.walletAddress,
        projectId,
        nodeId
      );
      writeFile(resp, file);
    } catch (error) {
      writeApiError(resp, error);
    }
  }
);

interface PublicListRequestWithAuth extends PublicListProjectNodesRequest {
  authorization?: Header<"Authorization">;
}

export const listPublicProjectNodes = api(
  { method: "GET", path: "/authors/:slug/projects/:projectId/nodes", expose: true },
  async (req: PublicListRequestWithAuth): Promise<{ nodes: ProjectNodeResponse[] }> => {
    const viewerWallet = await getOptionalViewerWallet(req.authorization);
    const nodes = await service.listPublicProjectNodes(
      req.slug,
      req.projectId,
      viewerWallet,
      req.parentId
    );
    return { nodes: nodes.map(service.toProjectNodeResponse) };
  }
);

export const downloadPublicProjectNode = api.raw(
  { method: "GET", path: "/authors/:slug/projects/:projectId/nodes/:nodeId/download", expose: true },
  async (req, resp) => {
    const { slug, projectId, nodeId } = parsePublicProjectNodeDownloadUrl(req.url!);
    const viewerWallet = await getOptionalViewerWallet(
      req.headers.authorization as string | undefined
    );

    try {
      const file = await service.downloadPublicProjectFile(
        slug,
        projectId,
        nodeId,
        viewerWallet
      );
      writeFile(resp, file);
    } catch (error) {
      writeApiError(resp, error);
    }
  }
);

async function getOptionalViewerWallet(
  authorization?: string
): Promise<string | undefined> {
  const token = authorization?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return undefined;
  }

  try {
    const auth = await validateToken(token);
    return auth.walletAddress;
  } catch (error) {
    if (error instanceof APIError && error.code === "unauthenticated") {
      return undefined;
    }
    throw error;
  }
}

function parseProjectFileUploadUrl(url: string, host?: string) {
  const parsedUrl = new URL(url, `http://${host ?? "localhost"}`);
  const match = parsedUrl.pathname.match(/^\/me\/projects\/([^/]+)\/files\/(.+)$/);
  if (!match) {
    throw APIError.invalidArgument("upload path is invalid");
  }

  const visibility = parsedUrl.searchParams.get("visibility");
  if (visibility && visibility !== "author" && visibility !== "published") {
    throw APIError.invalidArgument("visibility is invalid");
  }

  return {
    projectId: decodeURIComponent(match[1]),
    fileName: decodeURIComponent(match[2]),
    parentId: parsedUrl.searchParams.get("parentId"),
    visibility: visibility ? (visibility as "author" | "published") : undefined,
  };
}

function parseProjectNodeDownloadUrl(url: string, prefix: string) {
  const pathname = new URL(url, "http://localhost").pathname;
  const withoutPrefix = pathname.slice(prefix.length);
  const [projectId, nodesSegment, nodeId, downloadSegment] = withoutPrefix.split("/");
  if (nodesSegment !== "nodes" || downloadSegment !== "download") {
    throw APIError.invalidArgument("download path is invalid");
  }

  return {
    projectId: decodeURIComponent(projectId),
    nodeId: decodeURIComponent(nodeId),
  };
}

function parsePublicProjectNodeDownloadUrl(url: string) {
  const pathname = new URL(url, "http://localhost").pathname;
  const match = pathname.match(
    /^\/authors\/([^/]+)\/projects\/([^/]+)\/nodes\/([^/]+)\/download$/
  );
  if (!match) {
    throw APIError.invalidArgument("download path is invalid");
  }

  return {
    slug: decodeURIComponent(match[1]),
    projectId: decodeURIComponent(match[2]),
    nodeId: decodeURIComponent(match[3]),
  };
}

async function readRequestBody(req: AsyncIterable<string | Buffer | Uint8Array>) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(toBuffer(chunk));
  }
  return Buffer.concat(chunks);
}

function toBuffer(chunk: string | Buffer | Uint8Array): Buffer {
  if (typeof chunk === "string") {
    return Buffer.from(chunk);
  }
  return Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
}

function writeFile(
  resp: { writeHead: (status: number, headers: Record<string, string>) => void; end: (body: Buffer | string) => void },
  file: { body: Buffer; contentType: string; name: string }
) {
  resp.writeHead(200, {
    "Content-Type": file.contentType,
    "Content-Length": String(file.body.length),
    "Content-Disposition": `attachment; filename="${encodeURIComponent(file.name)}"`,
  });
  resp.end(file.body);
}

function writeJson(
  resp: { writeHead: (status: number, headers: Record<string, string>) => void; end: (body: string) => void },
  status: number,
  body: unknown
) {
  resp.writeHead(status, { "Content-Type": "application/json" });
  resp.end(JSON.stringify(body));
}

function writeApiError(
  resp: { writeHead: (status: number, headers: Record<string, string>) => void; end: (body: string) => void },
  error: unknown
) {
  if (error instanceof APIError) {
    writeJson(resp, errorStatus(error), { error: error.message });
    return;
  }

  throw error;
}

function errorStatus(error: APIError): number {
  switch (error.code) {
    case "invalid_argument":
      return 400;
    case "not_found":
      return 404;
    case "permission_denied":
      return 403;
    case "unauthenticated":
      return 401;
    default:
      return 500;
  }
}
