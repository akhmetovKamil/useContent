import { api } from "encore.dev/api";
import type {
  GetNonceDto,
  GetNonceInput,
  VerifySignatureDto,
  VerifySignatureInput,
} from "../../shared/types/auth";
import { requestNonce, authenticate } from "./auth.service";

export const getNonce = api(
  { method: "GET", path: "/auth/nonce", expose: true },
  async ({ address }: GetNonceInput): Promise<GetNonceDto> => {
    const message = await requestNonce(address);
    return { message };
  }
);

export const verifySignature = api(
  { method: "POST", path: "/auth/verify", expose: true },
  async ({ address, signature }: VerifySignatureInput): Promise<VerifySignatureDto> => {
    const { token, expiresAt } = await authenticate(address, signature);
    return { token, expiresAt: expiresAt.toISOString() };
  }
);
