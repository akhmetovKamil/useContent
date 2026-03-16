import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import * as service from "./files.service";
import { toResponse } from "./files.service";
import type {
  CreateFolderRequest,
  FileResponse,
  ListFilesRequest,
  ListFilesResponse,
  DeleteFileRequest,
  UpdateFileRequest,
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
