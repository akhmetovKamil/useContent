export interface GetNonceRequest {
  address: string;
}

export interface GetNonceResponse {
  message: string;
}

export interface VerifySignatureRequest {
  address: string;
  signature: string;
}

export interface VerifySignatureResponse {
  token: string;
}

export interface NonceDoc {
  address: string;
  nonce: string;
  expiresAt: Date;
}

export interface AuthUser {
  userID: string;
  walletAddress: string;
}
