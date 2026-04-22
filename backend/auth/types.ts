import type { WalletAddress } from "../../shared/types/content";

export interface NonceDoc {
  address: WalletAddress;
  nonce: string;
  expiresAt: Date;
}

export interface AuthUser {
  userID: string;
  walletAddress: WalletAddress;
}
