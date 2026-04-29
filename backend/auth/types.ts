import type { WalletAddress } from "../../shared/types/common"

export interface NonceDoc {
  address: WalletAddress;
  nonce: string;
  expiresAt: Date;
}

export interface AuthUser {
  userID: string;
  walletAddress: WalletAddress;
}
