import { APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { ethers } from "ethers";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { randomBytes } from "node:crypto";
import { upsertNonce, findNonce, deleteNonce } from "./repository";
import type { AuthUser } from "./types";

const jwtSecret = secret("JwtSecret");

const NONCE_TTL_MS = 5 * 60 * 1000;
const JWT_TTL_MS = 24 * 60 * 60 * 1000;

function jwtKey(): Uint8Array {
  return new TextEncoder().encode(jwtSecret());
}

function buildSignMessage(address: string, nonce: string): string {
  return `Sign in to useContent\n\nAddress: ${address}\nNonce: ${nonce}`;
}

export async function requestNonce(rawAddress: string): Promise<string> {
  const address = rawAddress.toLowerCase();
  const nonce = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + NONCE_TTL_MS);

  await upsertNonce(address, nonce, expiresAt);

  return buildSignMessage(address, nonce);
}

export async function authenticate(
  rawAddress: string,
  signature: string
): Promise<{ token: string; expiresAt: Date }> {
  const address = rawAddress.toLowerCase();

  const doc = await findNonce(address);
  if (!doc) {
    throw APIError.notFound("nonce not found");
  }
  if (doc.expiresAt < new Date()) {
    throw APIError.failedPrecondition("nonce expired — request a new one");
  }

  const message = buildSignMessage(address, doc.nonce);

  let recovered: string;
  try {
    recovered = ethers.verifyMessage(message, signature).toLowerCase();
  } catch {
    throw APIError.unauthenticated("invalid signature format");
  }

  if (recovered !== address) {
    throw APIError.unauthenticated("signature does not match address");
  }

  await deleteNonce(address);

  const expiresAt = new Date(Date.now() + JWT_TTL_MS);
  const token = await new SignJWT({ walletAddress: address })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(address)
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(jwtKey());

  return { token, expiresAt };
}

export async function validateToken(token: string): Promise<AuthUser> {
  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(token, jwtKey()));
  } catch {
    throw APIError.unauthenticated("invalid or expired token");
  }

  const walletAddress = payload["walletAddress"];
  if (typeof walletAddress !== "string") {
    throw APIError.unauthenticated("malformed token");
  }

  return { userID: walletAddress, walletAddress };
}
