export * from "../lib/content-types";

export interface GetAuthorProfileRequest {
  slug: string;
}

export interface ListAuthorsRequest {
  q?: string;
}
