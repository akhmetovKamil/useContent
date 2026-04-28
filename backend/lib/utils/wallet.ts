import { APIError } from "encore.dev/api";
import {
  normalizeAddressLike,
  shortenWalletAddress,
} from "../../../shared/utils";

export function normalizeWallet(walletAddress: string): string {
  const value = normalizeAddressLike(walletAddress);
  if (!value) {
    throw APIError.invalidArgument("wallet address is required");
  }
  return value;
}

export function shortenWallet(walletAddress: string): string {
  return shortenWalletAddress(walletAddress);
}
