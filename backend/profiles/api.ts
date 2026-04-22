import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import * as service from "./service";
import type {
  AuthorCatalogItemResponse,
  AuthorProfileResponse,
  AuthorStorageUsageResponse,
  CreateAuthorProfileRequest,
  UpdateAuthorProfileRequest,
  UpdateMyProfileRequest,
  UserProfileResponse,
} from "./types";

export const getMe = api(
  { method: "GET", path: "/me", expose: true, auth: true },
  async (): Promise<UserProfileResponse> => {
    const auth = getAuthData()!;
    const user = await service.getOrCreateUserByWallet(auth.walletAddress);
    return service.toUserProfileResponse(user);
  },
);

export const updateMe = api(
  { method: "PATCH", path: "/me", expose: true, auth: true },
  async (req: UpdateMyProfileRequest): Promise<UserProfileResponse> => {
    const auth = getAuthData()!;
    const user = await service.updateMyProfile(auth.walletAddress, req);
    return service.toUserProfileResponse(user);
  },
);

export const createMyAuthorProfile = api(
  { method: "POST", path: "/authors", expose: true, auth: true },
  async (req: CreateAuthorProfileRequest): Promise<AuthorProfileResponse> => {
    const auth = getAuthData()!;
    const author = await service.createAuthorProfile(auth.walletAddress, req);
    return service.toAuthorProfileResponse(author);
  },
);

export const listAuthors = api(
  { method: "GET", path: "/authors", expose: true },
  async ({
    q,
  }: {
    q?: string;
  }): Promise<{ authors: AuthorCatalogItemResponse[] }> => {
    const authors = await service.listAuthors(q);
    return { authors };
  },
);

export const getMyAuthorProfile = api(
  { method: "GET", path: "/me/author", expose: true, auth: true },
  async (): Promise<AuthorProfileResponse> => {
    const auth = getAuthData()!;
    const author = await service.getMyAuthorProfile(auth.walletAddress);
    return service.toAuthorProfileResponse(author);
  },
);

export const updateMyAuthorProfile = api(
  { method: "PATCH", path: "/me/author", expose: true, auth: true },
  async (req: UpdateAuthorProfileRequest): Promise<AuthorProfileResponse> => {
    const auth = getAuthData()!;
    const author = await service.updateMyAuthorProfile(auth.walletAddress, req);
    return service.toAuthorProfileResponse(author);
  },
);

export const deleteMyAuthorProfile = api(
  { method: "DELETE", path: "/me/author", expose: true, auth: true },
  async (): Promise<void> => {
    const auth = getAuthData()!;
    await service.deleteMyAuthorProfile(auth.walletAddress);
  },
);

export const getMyAuthorStorageUsage = api(
  { method: "GET", path: "/me/author/storage-usage", expose: true, auth: true },
  async (): Promise<AuthorStorageUsageResponse> => {
    const auth = getAuthData()!;
    return service.getMyAuthorStorageUsage(auth.walletAddress);
  },
);

export const getAuthorProfile = api(
  { method: "GET", path: "/authors/:slug", expose: true },
  async ({ slug }: { slug: string }): Promise<AuthorProfileResponse> => {
    const author = await service.getAuthorProfileBySlug(slug);
    return service.toAuthorProfileResponse(author);
  },
);
