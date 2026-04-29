import { APIError } from "encore.dev/api";
import { normalizeAddressLike } from "../../../shared/utils/web3";

export function normalizeWallet(walletAddress: string): string {
  const value = normalizeAddressLike(walletAddress);
  if (!value) {
    throw APIError.invalidArgument("wallet address is required");
  }
  return value;
}
