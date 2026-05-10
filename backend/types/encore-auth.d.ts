import type { AuthUser } from "../auth/types";

declare module "~encore/auth" {
  export type AuthData = AuthUser;

  export function getAuthData(): AuthData | null;
}
