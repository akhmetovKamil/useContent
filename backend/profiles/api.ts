import { api } from "encore.dev/api";
import { getRequiredWallet } from "../lib/api-helpers";
import {
  toAuthorProfileResponse,
  toUserProfileResponse,
} from "../lib/content-common";
import * as service from "./service";
import type {
  AuthorCatalogItemResponse,
  AuthorProfileResponse,
  AuthorStorageUsageResponse,
  CreateAuthorProfileRequest,
  GetAuthorProfileRequest,
  ListAuthorsRequest,
  UpdateAuthorProfileRequest,
  UpdateMyProfileRequest,
  UserProfileResponse,
} from "./types";
import type { ListAuthorsResponseDto } from "../../shared/types/content";

export const getMe = api(
  { method: "GET", path: "/me", expose: true, auth: true },
  async (): Promise<UserProfileResponse> => {
    const walletAddress = getRequiredWallet();
    const user = await service.getOrCreateUserByWallet(walletAddress);
    return toUserProfileResponse(user);
  },
);

export const updateMe = api(
  { method: "PATCH", path: "/me", expose: true, auth: true },
  async (req: UpdateMyProfileRequest): Promise<UserProfileResponse> => {
    const walletAddress = getRequiredWallet();
    const user = await service.updateMyProfile(walletAddress, req);
    return toUserProfileResponse(user);
  },
);

export const createMyAuthorProfile = api(
  { method: "POST", path: "/authors", expose: true, auth: true },
  async (req: CreateAuthorProfileRequest): Promise<AuthorProfileResponse> => {
    const walletAddress = getRequiredWallet();
    const author = await service.createAuthorProfile(walletAddress, req);
    return toAuthorProfileResponse(author);
  },
);

export const listAuthors = api(
  { method: "GET", path: "/authors", expose: true },
  async ({ q }: ListAuthorsRequest): Promise<ListAuthorsResponseDto> => {
    const authors = await service.listAuthors(q);
    return { authors };
  },
);

export const getMyAuthorProfile = api(
  { method: "GET", path: "/me/author", expose: true, auth: true },
  async (): Promise<AuthorProfileResponse> => {
    const walletAddress = getRequiredWallet();
    const author = await service.getMyAuthorProfile(walletAddress);
    return toAuthorProfileResponse(author);
  },
);

export const updateMyAuthorProfile = api(
  { method: "PATCH", path: "/me/author", expose: true, auth: true },
  async (req: UpdateAuthorProfileRequest): Promise<AuthorProfileResponse> => {
    const walletAddress = getRequiredWallet();
    const author = await service.updateMyAuthorProfile(walletAddress, req);
    return toAuthorProfileResponse(author);
  },
);

export const deleteMyAuthorProfile = api(
  { method: "DELETE", path: "/me/author", expose: true, auth: true },
  async (): Promise<void> => {
    const walletAddress = getRequiredWallet();
    await service.deleteMyAuthorProfile(walletAddress);
  },
);

export const getMyAuthorStorageUsage = api(
  { method: "GET", path: "/me/author/storage-usage", expose: true, auth: true },
  async (): Promise<AuthorStorageUsageResponse> => {
    const walletAddress = getRequiredWallet();
    return service.getMyAuthorStorageUsage(walletAddress);
  },
);

export const getAuthorProfile = api(
  { method: "GET", path: "/authors/:slug", expose: true },
  async ({ slug }: GetAuthorProfileRequest): Promise<AuthorProfileResponse> => {
    const author = await service.getAuthorProfileBySlug(slug);
    return toAuthorProfileResponse(author);
  },
);
