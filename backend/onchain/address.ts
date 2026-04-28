import { APIError } from "encore.dev/api";
import { isAddress } from "ethers";

export function normalizeAddress(address: string): string {
  if (!isAddress(address)) {
    throw APIError.invalidArgument("invalid address");
  }

  return address.toLowerCase();
}

export function tryNormalizeAddress(address: string): string | null {
  return isAddress(address) ? address.toLowerCase() : null;
}

export function normalizeBytes32(value: string): string {
  return value.toLowerCase();
}
