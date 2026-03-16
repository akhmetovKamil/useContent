import { api } from "encore.dev/api";
import { requestNonce, authenticate } from "./auth.service";
import type {
  GetNonceRequest,
  GetNonceResponse,
  VerifySignatureRequest,
  VerifySignatureResponse,
} from "./types";

export const getNonce = api(
  { method: "GET", path: "/auth/nonce", expose: true },
  async ({ address }: GetNonceRequest): Promise<GetNonceResponse> => {
    const message = await requestNonce(address);
    return { message };
  }
);

export const verifySignature = api(
  { method: "POST", path: "/auth/verify", expose: true },
  async ({ address, signature }: VerifySignatureRequest): Promise<VerifySignatureResponse> => {
    const token = await authenticate(address, signature);
    return { token };
  }
);
