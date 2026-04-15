import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import * as service from "./content.service";
import type {
  AuthorProfileResponse,
  CreateAuthorProfileRequest,
  SubscriptionPlanResponse,
  SubscriptionEntitlementResponse,
  UpsertSubscriptionPlanRequest,
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

export const getMyAuthorProfile = api(
  { method: "GET", path: "/me/author", expose: true, auth: true },
  async (): Promise<AuthorProfileResponse> => {
    const auth = getAuthData()!;
    const author = await service.getMyAuthorProfile(auth.walletAddress);
    return service.toAuthorProfileResponse(author);
  }
);

export const listMyEntitlements = api(
  { method: "GET", path: "/me/entitlements", expose: true, auth: true },
  async (): Promise<{ entitlements: SubscriptionEntitlementResponse[] }> => {
    const auth = getAuthData()!;
    const entitlements = await service.listMyEntitlements(auth.walletAddress);
    return {
      entitlements: entitlements.map(service.toSubscriptionEntitlementResponse),
    };
  }
);

export const getMySubscriptionPlan = api(
  { method: "GET", path: "/me/subscription-plan", expose: true, auth: true },
  async (): Promise<SubscriptionPlanResponse> => {
    const auth = getAuthData()!;
    const plan = await service.getMySubscriptionPlan(auth.walletAddress);
    return service.toSubscriptionPlanResponse(plan);
  }
);

export const upsertMySubscriptionPlan = api(
  { method: "PUT", path: "/me/subscription-plan", expose: true, auth: true },
  async (req: UpsertSubscriptionPlanRequest): Promise<SubscriptionPlanResponse> => {
    const auth = getAuthData()!;
    const plan = await service.upsertMySubscriptionPlan(auth.walletAddress, req);
    return service.toSubscriptionPlanResponse(plan);
  }
);

export const getAuthorProfile = api(
  { method: "GET", path: "/authors/:slug", expose: true },
  async ({ slug }: { slug: string }): Promise<AuthorProfileResponse> => {
    const author = await service.getAuthorProfileBySlug(slug);
    return service.toAuthorProfileResponse(author);
  }
);

export const getAuthorSubscriptionPlan = api(
  { method: "GET", path: "/authors/:slug/subscription-plan", expose: true },
  async ({ slug }: { slug: string }): Promise<SubscriptionPlanResponse> => {
    const plan = await service.getAuthorSubscriptionPlanBySlug(slug);
    return service.toSubscriptionPlanResponse(plan);
  }
);
