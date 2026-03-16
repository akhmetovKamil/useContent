import { APIError, Header, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { validateToken } from "./auth.service";
import type { AuthUser } from "./types";

interface AuthParams {
  authorization: Header<"Authorization">;
}

export const auth = authHandler<AuthParams, AuthUser>(
  async ({ authorization }) => {
    const token = authorization?.replace(/^Bearer\s+/i, "");
    if (!token) {
      throw APIError.unauthenticated("missing bearer token");
    }
    return validateToken(token);
  }
);

export const gateway = new Gateway({ authHandler: auth });
