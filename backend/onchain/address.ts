import { APIError } from "encore.dev/api";
import { isAddress } from "ethers";
import { normalizeAddressLike, normalizeHexString } from "../../shared/utils";

export function normalizeAddress(address: string): string {
  if (!isAddress(address)) {
    throw APIError.invalidArgument("invalid address");
  }

  return normalizeAddressLike(address);
}

export function tryNormalizeAddress(address: string): string | null {
  return isAddress(address) ? normalizeAddressLike(address) : null;
}

export function normalizeBytes32(value: string): string {
  return normalizeHexString(value);
}
