import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import * as service from "./content.service";
import type {
  AuthorProfileResponse,
  CreateAuthorProfileRequest,
  UpdateMyProfileRequest,
  UserProfileResponse,
} from "./types";

export const getMe = api(
  { method: "GET", path: "/me", expose: true, auth: true },
  async (): Promise<UserProfileResponse> => {
    const auth = getAuthData()!;
    const user = await service.getOrCreateUserByWallet(auth.walletAddress);
    return service.toUserProfileResponse(user);
  }
);

export const updateMe = api(
  { method: "PATCH", path: "/me", expose: true, auth: true },
  async (req: UpdateMyProfileRequest): Promise<UserProfileResponse> => {
    const auth = getAuthData()!;
    const user = await service.updateMyProfile(auth.walletAddress, req);
    return service.toUserProfileResponse(user);
  }
);

export const createMyAuthorProfile = api(
  { method: "POST", path: "/authors", expose: true, auth: true },
  async (req: CreateAuthorProfileRequest): Promise<AuthorProfileResponse> => {
    const auth = getAuthData()!;
    const author = await service.createAuthorProfile(auth.walletAddress, req);
    return service.toAuthorProfileResponse(author);
  }
);

export const getAuthorProfile = api(
  { method: "GET", path: "/authors/:slug", expose: true },
  async ({ slug }: { slug: string }): Promise<AuthorProfileResponse> => {
    const author = await service.getAuthorProfileBySlug(slug);
    return service.toAuthorProfileResponse(author);
  }
);
