import { api } from "encore.dev/api";
import {
  getRequiredWallet,
  readRequestBody,
} from "../lib/api-helpers";
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
import type { ListAuthorsResponseDto } from "../../shared/types/responses"

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

export const uploadMyProfileAvatar = api.raw(
  { method: "POST", path: "/me/avatar", expose: true, auth: true },
  async (req, resp) => {
    const walletAddress = getRequiredWallet();
    const user = await service.uploadMyProfileAvatar(walletAddress, {
      body: await readRequestBody(req),
      contentType: String(req.headers["content-type"] ?? "application/octet-stream"),
    });

    resp.writeHead(200, { "Content-Type": "application/json" });
    resp.end(JSON.stringify(toUserProfileResponse(user)));
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

export const uploadMyAuthorAvatar = api.raw(
  { method: "POST", path: "/me/author/avatar", expose: true, auth: true },
  async (req, resp) => {
    const walletAddress = getRequiredWallet();
    const author = await service.uploadMyAuthorAvatar(walletAddress, {
      body: await readRequestBody(req),
      contentType: String(req.headers["content-type"] ?? "application/octet-stream"),
    });

    resp.writeHead(200, { "Content-Type": "application/json" });
    resp.end(JSON.stringify(toAuthorProfileResponse(author)));
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

export const downloadProfileAvatar = api.raw(
  { method: "GET", path: "/profile-avatars/*avatarFileId", expose: true },
  async (req, resp) => {
    const avatarFileId = new URL(req.url ?? "", "http://localhost").pathname
      .split("/")
      .filter(Boolean)
      .at(-1);
    const file = await service.getProfileAvatar(avatarFileId ?? "");
    resp.writeHead(200, {
      "Content-Type": file.contentType,
      "Content-Length": String(file.body.length),
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.fileName)}"`,
    });
    resp.end(file.body);
  },
);
