import { APIError, type Header } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { validateToken } from "../auth/auth.service";

export function getRequiredWallet(): string {
  return getAuthData()!.walletAddress;
}

export async function getOptionalViewerWallet(
  authorization?: Header<"Authorization"> | string,
): Promise<string | undefined> {
  const token = String(authorization ?? "")
    .replace(/^Bearer\s+/i, "")
    .trim();
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

export function assertDeploymentRegistryToken(
  expected: string,
  token: string | undefined,
): void {
  if (!expected || token !== expected) {
    throw APIError.permissionDenied("invalid deployment registry token");
  }
}

export async function readRequestBody(
  req: AsyncIterable<string | Buffer | Uint8Array>,
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(toBuffer(chunk));
  }
  return Buffer.concat(chunks);
}

export function parseFilePath(url: string, prefix: string): string[] {
  const path = new URL(url, "http://localhost").pathname.replace(prefix, "");
  return path.split("/").filter(Boolean).map(decodeURIComponent);
}

export function writeFileResponse(
  resp: {
    writeHead: (statusCode: number, headers: Record<string, string>) => void;
    end: (chunk?: Buffer) => void;
  },
  file: { body: Buffer; contentType: string; fileName: string },
): void {
  resp.writeHead(200, {
    "Content-Type": file.contentType,
    "Content-Length": String(file.body.length),
    "Content-Disposition": `attachment; filename="${encodeURIComponent(
      file.fileName,
    )}"`,
  });
  resp.end(file.body);
}

function toBuffer(chunk: string | Buffer | Uint8Array): Buffer {
  if (typeof chunk === "string") {
    return Buffer.from(chunk);
  }
  if (Buffer.isBuffer(chunk)) {
    return chunk;
  }
  return Buffer.from(chunk);
}
