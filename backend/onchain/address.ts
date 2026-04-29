import { APIError } from "encore.dev/api";
import { isAddress } from "ethers";
import { normalizeAddressLike } from "../../shared/utils/web3";

export function normalizeAddress(address: string): string {
  if (!isAddress(address)) {
    throw APIError.invalidArgument("invalid address");
  }

  return normalizeAddressLike(address);
}

export function tryNormalizeAddress(address: string): string | null {
  return isAddress(address) ? normalizeAddressLike(address) : null;
}
