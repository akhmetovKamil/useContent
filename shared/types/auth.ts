import type { WalletAddress } from "./common";

export interface GetNonceInput {
  address: WalletAddress;
}

export interface GetNonceDto {
  message: string;
}

export interface VerifySignatureInput {
  address: WalletAddress;
  signature: string;
}

export interface VerifySignatureDto {
  token: string;
  expiresAt: string;
}
