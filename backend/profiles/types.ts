export type {
  AuthorCatalogItemResponse,
  AuthorProfileResponse,
  AuthorStorageUsageResponse,
  CreateAuthorProfileRequest,
  UpdateAuthorProfileRequest,
  UpdateMyProfileRequest,
  UserProfileResponse,
} from "../lib/content-types";

export interface GetAuthorProfileRequest {
  slug: string;
}

export interface ListAuthorsRequest {
  q?: string;
}
