import { api, APIError, Header } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { validateToken } from "../auth/auth.service";
import * as service from "./content.service";
import type {
  AccessPolicyPresetResponse,
  AuthorProfileResponse,
  ConfirmSubscriptionPaymentRequest,
  CreateAccessPolicyPresetRequest,
  CreateAuthorProfileRequest,
  CreatePostRequest,
  CreateProjectRequest,
  CreateSubscriptionPaymentIntentRequest,
  PostResponse,
  ProjectResponse,
  SubscriptionPaymentIntentResponse,
  SubscriptionPlanResponse,
  SubscriptionEntitlementResponse,
  UpdateAuthorProfileRequest,
  UpdateAccessPolicyPresetRequest,
  UpsertSubscriptionPlanRequest,
  UpdateMyProfileRequest,
  UpdatePostRequest,
  UpdateProjectRequest,
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

export const updateMyAuthorProfile = api(
  { method: "PATCH", path: "/me/author", expose: true, auth: true },
  async (req: UpdateAuthorProfileRequest): Promise<AuthorProfileResponse> => {
    const auth = getAuthData()!;
    const author = await service.updateMyAuthorProfile(auth.walletAddress, req);
    return service.toAuthorProfileResponse(author);
  }
);

export const listMyAccessPolicyPresets = api(
  { method: "GET", path: "/me/access-policies", expose: true, auth: true },
  async (): Promise<{ policies: AccessPolicyPresetResponse[] }> => {
    const auth = getAuthData()!;
    const policies = await service.listMyAccessPolicyPresets(auth.walletAddress);
    return { policies: policies.map(service.toAccessPolicyPresetResponse) };
  }
);

export const createMyAccessPolicyPreset = api(
  { method: "POST", path: "/me/access-policies", expose: true, auth: true },
  async (req: CreateAccessPolicyPresetRequest): Promise<AccessPolicyPresetResponse> => {
    const auth = getAuthData()!;
    const policy = await service.createMyAccessPolicyPreset(auth.walletAddress, req);
    return service.toAccessPolicyPresetResponse(policy);
  }
);

export const updateMyAccessPolicyPreset = api(
  { method: "PATCH", path: "/me/access-policies/:policyId", expose: true, auth: true },
  async ({
    policyId,
    ...req
  }: UpdateAccessPolicyPresetRequest & { policyId: string }): Promise<AccessPolicyPresetResponse> => {
    const auth = getAuthData()!;
    const policy = await service.updateMyAccessPolicyPreset(
      auth.walletAddress,
      policyId,
      req
    );
    return service.toAccessPolicyPresetResponse(policy);
  }
);

export const deleteMyAccessPolicyPreset = api(
  { method: "DELETE", path: "/me/access-policies/:policyId", expose: true, auth: true },
  async ({ policyId }: { policyId: string }): Promise<void> => {
    const auth = getAuthData()!;
    await service.deleteMyAccessPolicyPreset(auth.walletAddress, policyId);
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

export const listMySubscriptionPaymentIntents = api(
  {
    method: "GET",
    path: "/me/subscription-payment-intents",
    expose: true,
    auth: true,
  },
  async (): Promise<{ intents: SubscriptionPaymentIntentResponse[] }> => {
    const auth = getAuthData()!;
    const intents = await service.listMySubscriptionPaymentIntents(auth.walletAddress);
    return {
      intents: intents.map(service.toSubscriptionPaymentIntentResponse),
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

export const listMySubscriptionPlans = api(
  { method: "GET", path: "/me/subscription-plans", expose: true, auth: true },
  async (): Promise<{ plans: SubscriptionPlanResponse[] }> => {
    const auth = getAuthData()!;
    const plans = await service.listMySubscriptionPlans(auth.walletAddress);
    return { plans: plans.map(service.toSubscriptionPlanResponse) };
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

export const listAuthorSubscriptionPlans = api(
  { method: "GET", path: "/authors/:slug/subscription-plans", expose: true },
  async ({ slug }: { slug: string }): Promise<{ plans: SubscriptionPlanResponse[] }> => {
    const plans = await service.listAuthorSubscriptionPlansBySlug(slug);
    return { plans: plans.map(service.toSubscriptionPlanResponse) };
  }
);

export const createSubscriptionPaymentIntent = api(
  {
    method: "POST",
    path: "/authors/:slug/subscription-payment-intents",
    expose: true,
    auth: true,
  },
  async ({
    slug,
    ...req
  }: CreateSubscriptionPaymentIntentRequest & {
    slug: string;
  }): Promise<SubscriptionPaymentIntentResponse> => {
    const auth = getAuthData()!;
    const intent = await service.createSubscriptionPaymentIntent(
      auth.walletAddress,
      slug,
      req
    );
    return service.toSubscriptionPaymentIntentResponse(intent);
  }
);

export const confirmSubscriptionPayment = api(
  {
    method: "POST",
    path: "/me/subscription-payment-intents/:intentId/confirm",
    expose: true,
    auth: true,
  },
  async ({
    intentId,
    ...req
  }: ConfirmSubscriptionPaymentRequest & {
    intentId: string;
  }): Promise<SubscriptionPaymentIntentResponse> => {
    const auth = getAuthData()!;
    const intent = await service.confirmSubscriptionPayment(
      auth.walletAddress,
      intentId,
      req
    );
    return service.toSubscriptionPaymentIntentResponse(intent);
  }
);

export const createMyPost = api(
  { method: "POST", path: "/me/posts", expose: true, auth: true },
  async (req: CreatePostRequest): Promise<PostResponse> => {
    const auth = getAuthData()!;
    const post = await service.createMyPost(auth.walletAddress, req);
    return service.toPostResponse(post);
  }
);

export const listMyPosts = api(
  { method: "GET", path: "/me/posts", expose: true, auth: true },
  async (): Promise<{ posts: PostResponse[] }> => {
    const auth = getAuthData()!;
    const posts = await service.listMyPosts(auth.walletAddress);
    return { posts: posts.map(service.toPostResponse) };
  }
);

export const updateMyPost = api(
  { method: "PATCH", path: "/me/posts/:postId", expose: true, auth: true },
  async ({
    postId,
    ...req
  }: UpdatePostRequest & { postId: string }): Promise<PostResponse> => {
    const auth = getAuthData()!;
    const post = await service.updateMyPost(auth.walletAddress, postId, req);
    return service.toPostResponse(post);
  }
);

export const deleteMyPost = api(
  { method: "DELETE", path: "/me/posts/:postId", expose: true, auth: true },
  async ({ postId }: { postId: string }): Promise<void> => {
    const auth = getAuthData()!;
    await service.deleteMyPost(auth.walletAddress, postId);
  }
);

export const listAuthorPosts = api(
  { method: "GET", path: "/authors/:slug/posts", expose: true },
  async ({ slug }: { slug: string }): Promise<{ posts: PostResponse[] }> => {
    const posts = await service.listAuthorPostsBySlug(slug);
    return { posts: posts.map(service.toPostResponse) };
  }
);

interface GetAuthorPostRequest {
  slug: string;
  postId: string;
  authorization?: Header<"Authorization">;
}

export const getAuthorPost = api(
  { method: "GET", path: "/authors/:slug/posts/:postId", expose: true },
  async ({ slug, postId, authorization }: GetAuthorPostRequest): Promise<PostResponse> => {
    const viewerWallet = await getOptionalViewerWallet(authorization);
    const post = await service.getAuthorPostBySlugAndId(
      slug,
      postId,
      viewerWallet
    );
    return service.toPostResponse(post);
  }
);

export const createMyProject = api(
  { method: "POST", path: "/me/projects", expose: true, auth: true },
  async (req: CreateProjectRequest): Promise<ProjectResponse> => {
    const auth = getAuthData()!;
    const project = await service.createMyProject(auth.walletAddress, req);
    return service.toProjectResponse(project);
  }
);

export const listMyProjects = api(
  { method: "GET", path: "/me/projects", expose: true, auth: true },
  async (): Promise<{ projects: ProjectResponse[] }> => {
    const auth = getAuthData()!;
    const projects = await service.listMyProjects(auth.walletAddress);
    return { projects: projects.map(service.toProjectResponse) };
  }
);

export const updateMyProject = api(
  { method: "PATCH", path: "/me/projects/:projectId", expose: true, auth: true },
  async ({
    projectId,
    ...req
  }: UpdateProjectRequest & { projectId: string }): Promise<ProjectResponse> => {
    const auth = getAuthData()!;
    const project = await service.updateMyProject(
      auth.walletAddress,
      projectId,
      req
    );
    return service.toProjectResponse(project);
  }
);

export const deleteMyProject = api(
  { method: "DELETE", path: "/me/projects/:projectId", expose: true, auth: true },
  async ({ projectId }: { projectId: string }): Promise<void> => {
    const auth = getAuthData()!;
    await service.deleteMyProject(auth.walletAddress, projectId);
  }
);

export const listAuthorProjects = api(
  { method: "GET", path: "/authors/:slug/projects", expose: true },
  async ({ slug }: { slug: string }): Promise<{ projects: ProjectResponse[] }> => {
    const projects = await service.listAuthorProjectsBySlug(slug);
    return { projects: projects.map(service.toProjectResponse) };
  }
);

interface GetAuthorProjectRequest {
  slug: string;
  projectId: string;
  authorization?: Header<"Authorization">;
}

export const getAuthorProject = api(
  { method: "GET", path: "/authors/:slug/projects/:projectId", expose: true },
  async ({ slug, projectId, authorization }: GetAuthorProjectRequest): Promise<ProjectResponse> => {
    const viewerWallet = await getOptionalViewerWallet(authorization);
    const project = await service.getAuthorProjectBySlugAndId(
      slug,
      projectId,
      viewerWallet
    );
    return service.toProjectResponse(project);
  }
);

async function getOptionalViewerWallet(
  authorization?: string
): Promise<string | undefined> {
  const token = authorization?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return undefined;
  }

  try {
    const auth = await validateToken(token);
    return auth.walletAddress;
  } catch (error) {
    if (error instanceof APIError && error.code === "unauthenticated") {
      return undefined;
    }
    throw error;
  }
}
