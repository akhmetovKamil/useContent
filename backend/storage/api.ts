import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { userContent } from "./bucket";

export const upload = api.raw(
  { method: "POST", path: "/storage/upload/*key", expose: true, auth: true },
  async (req, resp) => {
    const auth = getAuthData()!;
    const key = req.url!.replace("/storage/upload/", "");
    if (!key) {
      resp.writeHead(400, { "Content-Type": "application/json" });
      resp.end(JSON.stringify({ error: "key is required" }));
      return;
    }

    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const body = Buffer.concat(chunks);

    const namespacedKey = `${auth.walletAddress}/${key}`;
    const contentType = req.headers["content-type"] || "application/octet-stream";

    await userContent.upload(namespacedKey, body, { contentType });

    resp.writeHead(200, { "Content-Type": "application/json" });
    resp.end(JSON.stringify({ key, size: body.length }));
  }
);

export const download = api.raw(
  { method: "GET", path: "/storage/download/*key", expose: true, auth: true },
  async (req, resp) => {
    const auth = getAuthData()!;
    const key = req.url!.replace("/storage/download/", "").split("?")[0];
    if (!key) {
      resp.writeHead(400, { "Content-Type": "application/json" });
      resp.end(JSON.stringify({ error: "key is required" }));
      return;
    }

    const namespacedKey = `${auth.walletAddress}/${key}`;

    try {
      const attrs = await userContent.attrs(namespacedKey);
      const data = await userContent.download(namespacedKey);
      const chunks: Buffer[] = [];
      for await (const chunk of data) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
      const body = Buffer.concat(chunks);

      resp.writeHead(200, {
        "Content-Type": attrs.contentType || "application/octet-stream",
        "Content-Length": String(body.length),
      });
      resp.end(body);
    } catch (err: any) {
      if (err?.code === "object_not_found" || err?.name === "ObjectNotFound") {
        resp.writeHead(404, { "Content-Type": "application/json" });
        resp.end(JSON.stringify({ error: "file not found" }));
      } else {
        throw err;
      }
    }
  }
);

interface ListResponse {
  files: { key: string; size: number; lastModified: string }[];
}

export const list = api(
  { method: "GET", path: "/storage/list", expose: true, auth: true },
  async (): Promise<ListResponse> => {
    const auth = getAuthData()!;
    const prefix = `${auth.walletAddress}/`;
    const files: ListResponse["files"] = [];

    for await (const entry of userContent.list({ prefix })) {
      files.push({
        key: entry.key.slice(prefix.length),
        size: entry.size,
        lastModified: entry.lastModified.toISOString(),
      });
    }

    return { files };
  }
);

interface DeleteRequest {
  key: string;
}

export const remove = api(
  { method: "DELETE", path: "/storage/file/*key", expose: true, auth: true },
  async ({ key }: DeleteRequest): Promise<void> => {
    const auth = getAuthData()!;
    if (!key) {
      throw APIError.invalidArgument("key is required");
    }
    const namespacedKey = `${auth.walletAddress}/${key}`;
    await userContent.remove(namespacedKey);
  }
);
