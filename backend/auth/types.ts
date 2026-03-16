// ─── Request / Response DTOs ─────────────────────────────────────────────────

export interface GetNonceRequest {
  /** EVM wallet address, e.g. 0xABCD… */
  address: string;
}

export interface GetNonceResponse {
  /** Human-readable message the user must sign with their wallet */
  message: string;
}

export interface VerifySignatureRequest {
  address: string;
  /** Signature produced by the wallet over the message from GET /auth/nonce */
  signature: string;
}

export interface VerifySignatureResponse {
  /** JWT bearer token for all subsequent requests */
  token: string;
}

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface NonceDoc {
  /** Lowercase EVM address — used as document key */
  address: string;
  nonce: string;
  expiresAt: Date;
}

export interface AuthUser {
  /** Stable user identity — lowercase wallet address */
  userID: string;
  walletAddress: string;
}
