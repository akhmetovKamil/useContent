import { api, APIError, Header } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { getAuthData } from "~encore/auth";
import { validateToken } from "../auth/auth.service";
import * as service from "./content.service";
import type {
  AccessPolicyPresetResponse,
  AuthorAccessPolicyResponse,
  AuthorCatalogItemResponse,
  AuthorProfileResponse,
  AuthorSubscriberResponse,
  ConfirmSubscriptionPaymentRequest,
  ContractDeploymentLookupResponse,
  ContractDeploymentResponse,
  CreateAccessPolicyPresetRequest,
  CreateAuthorProfileRequest,
  CreatePostRequest,
  CreateProjectFolderRequest,
  CreateProjectRequest,
  CreateSubscriptionPaymentIntentRequest,
  FeedPostResponse,
  FeedProjectResponse,
  PostResponse,
  ProjectNodeListResponse,
  ProjectNodeResponse,
  ProjectResponse,
  ReaderSubscriptionResponse,
  SubscriptionPaymentIntentResponse,
  SubscriptionPlanResponse,
  SubscriptionEntitlementResponse,
  UpdateAuthorProfileRequest,
  UpdateAccessPolicyPresetRequest,
  UpsertContractDeploymentRequest,
  UpsertSubscriptionPlanRequest,
  UpdateMyProfileRequest,
  UpdatePostRequest,
  UpdateProjectNodeRequest,
  UpdateProjectRequest,
  UserProfileResponse,
} from "./types";

const deploymentRegistryToken = secret("DeploymentRegistryToken");

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
  async (): Promise<{ authors: AuthorCatalogItemResponse[] }> => {
    const authors = await service.listAuthors();
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

export const listMyAccessPolicyPresets = api(
  { method: "GET", path: "/me/access-policies", expose: true, auth: true },
  async (): Promise<{ policies: AccessPolicyPresetResponse[] }> => {
    const auth = getAuthData()!;
    const policies = await service.listMyAccessPolicyPresets(
      auth.walletAddress,
    );
    return { policies: policies.map(service.toAccessPolicyPresetResponse) };
  },
);

export const createMyAccessPolicyPreset = api(
  { method: "POST", path: "/me/access-policies", expose: true, auth: true },
  async (
    req: CreateAccessPolicyPresetRequest,
  ): Promise<AccessPolicyPresetResponse> => {
    const auth = getAuthData()!;
    const policy = await service.createMyAccessPolicyPreset(
      auth.walletAddress,
      req,
    );
    return service.toAccessPolicyPresetResponse(policy);
  },
);

export const updateMyAccessPolicyPreset = api(
  {
    method: "PATCH",
    path: "/me/access-policies/:policyId",
    expose: true,
    auth: true,
  },
  async ({
    policyId,
    ...req
  }: UpdateAccessPolicyPresetRequest & {
    policyId: string;
  }): Promise<AccessPolicyPresetResponse> => {
    const auth = getAuthData()!;
    const policy = await service.updateMyAccessPolicyPreset(
      auth.walletAddress,
      policyId,
      req,
    );
    return service.toAccessPolicyPresetResponse(policy);
  },
);

export const deleteMyAccessPolicyPreset = api(
  {
    method: "DELETE",
    path: "/me/access-policies/:policyId",
    expose: true,
    auth: true,
  },
  async ({ policyId }: { policyId: string }): Promise<void> => {
    const auth = getAuthData()!;
    await service.deleteMyAccessPolicyPreset(auth.walletAddress, policyId);
  },
);

interface ListAuthorAccessPoliciesRequest {
  slug: string;
  authorization?: Header<"Authorization">;
}

export const listAuthorAccessPolicies = api(
  { method: "GET", path: "/authors/:slug/access-policies", expose: true },
  async ({
    slug,
    authorization,
  }: ListAuthorAccessPoliciesRequest): Promise<{
    policies: AuthorAccessPolicyResponse[];
  }> => {
    const viewerWallet = await getOptionalViewerWallet(authorization);
    const policies = await service.listAuthorAccessPoliciesBySlug(
      slug,
      viewerWallet,
    );
    return { policies };
  },
);

export const listMyEntitlements = api(
  { method: "GET", path: "/me/entitlements", expose: true, auth: true },
  async (): Promise<{ entitlements: SubscriptionEntitlementResponse[] }> => {
    const auth = getAuthData()!;
    const entitlements = await service.listMyEntitlements(auth.walletAddress);
    return {
      entitlements: entitlements.map(service.toSubscriptionEntitlementResponse),
    };
  },
);

export const listMyReaderSubscriptions = api(
  { method: "GET", path: "/me/subscriptions", expose: true, auth: true },
  async (): Promise<{ subscriptions: ReaderSubscriptionResponse[] }> => {
    const auth = getAuthData()!;
    const subscriptions = await service.listMyReaderSubscriptions(
      auth.walletAddress,
    );
    return { subscriptions };
  },
);

export const listMyFeedPosts = api(
  { method: "GET", path: "/me/feed", expose: true, auth: true },
  async (): Promise<{ posts: FeedPostResponse[] }> => {
    const auth = getAuthData()!;
    const posts = await service.listMyFeedPosts(auth.walletAddress);
    return { posts };
  },
);

export const listMyAuthorSubscribers = api(
  { method: "GET", path: "/me/author/subscribers", expose: true, auth: true },
  async (): Promise<{ subscribers: AuthorSubscriberResponse[] }> => {
    const auth = getAuthData()!;
    const subscribers = await service.listMyAuthorSubscribers(
      auth.walletAddress,
    );
    return { subscribers };
  },
);

export const getSubscriptionManagerDeployment = api(
  {
    method: "GET",
    path: "/contract-deployments/subscription-manager/:chainId",
    expose: true,
  },
  async ({
    chainId,
  }: {
    chainId: string;
  }): Promise<ContractDeploymentLookupResponse> => {
    const deployment = await service.getSubscriptionManagerDeployment(
      Number(chainId),
    );
    return {
      deployment: deployment
        ? service.toContractDeploymentResponse(deployment)
        : null,
    };
  },
);

export const upsertContractDeployment = api(
  {
    method: "PUT",
    path: "/admin/contract-deployments",
    expose: true,
  },
  async ({
    deploymentRegistryToken,
    ...req
  }: UpsertContractDeploymentRequest & {
    deploymentRegistryToken: Header<"X-Deployment-Registry-Token">;
  }): Promise<ContractDeploymentResponse> => {
    assertDeploymentRegistryToken(deploymentRegistryToken);
    const deployment = await service.upsertContractDeployment(req);
    return service.toContractDeploymentResponse(deployment);
  },
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
    const intents = await service.listMySubscriptionPaymentIntents(
      auth.walletAddress,
    );
    return {
      intents: intents.map(service.toSubscriptionPaymentIntentResponse),
    };
  },
);

export const getMySubscriptionPlan = api(
  { method: "GET", path: "/me/subscription-plan", expose: true, auth: true },
  async (): Promise<SubscriptionPlanResponse> => {
    const auth = getAuthData()!;
    const plan = await service.getMySubscriptionPlan(auth.walletAddress);
    return service.toSubscriptionPlanResponse(plan);
  },
);

export const listMySubscriptionPlans = api(
  { method: "GET", path: "/me/subscription-plans", expose: true, auth: true },
  async (): Promise<{ plans: SubscriptionPlanResponse[] }> => {
    const auth = getAuthData()!;
    const plans = await service.listMySubscriptionPlans(auth.walletAddress);
    return { plans: plans.map(service.toSubscriptionPlanResponse) };
  },
);

export const upsertMySubscriptionPlan = api(
  { method: "PUT", path: "/me/subscription-plan", expose: true, auth: true },
  async (
    req: UpsertSubscriptionPlanRequest,
  ): Promise<SubscriptionPlanResponse> => {
    const auth = getAuthData()!;
    const plan = await service.upsertMySubscriptionPlan(
      auth.walletAddress,
      req,
    );
    return service.toSubscriptionPlanResponse(plan);
  },
);

export const deleteMySubscriptionPlan = api(
  {
    method: "DELETE",
    path: "/me/subscription-plans/:planId",
    expose: true,
    auth: true,
  },
  async ({ planId }: { planId: string }): Promise<void> => {
    const auth = getAuthData()!;
    await service.deleteMySubscriptionPlan(auth.walletAddress, planId);
  },
);

export const getAuthorProfile = api(
  { method: "GET", path: "/authors/:slug", expose: true },
  async ({ slug }: { slug: string }): Promise<AuthorProfileResponse> => {
    const author = await service.getAuthorProfileBySlug(slug);
    return service.toAuthorProfileResponse(author);
  },
);

export const getAuthorSubscriptionPlan = api(
  { method: "GET", path: "/authors/:slug/subscription-plan", expose: true },
  async ({ slug }: { slug: string }): Promise<SubscriptionPlanResponse> => {
    const plan = await service.getAuthorSubscriptionPlanBySlug(slug);
    return service.toSubscriptionPlanResponse(plan);
  },
);

export const listAuthorSubscriptionPlans = api(
  { method: "GET", path: "/authors/:slug/subscription-plans", expose: true },
  async ({
    slug,
  }: {
    slug: string;
  }): Promise<{ plans: SubscriptionPlanResponse[] }> => {
    const plans = await service.listAuthorSubscriptionPlansBySlug(slug);
    return { plans: plans.map(service.toSubscriptionPlanResponse) };
  },
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
      req,
    );
    return service.toSubscriptionPaymentIntentResponse(intent);
  },
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
      req,
    );
    return service.toSubscriptionPaymentIntentResponse(intent);
  },
);

export const createMyPost = api(
  { method: "POST", path: "/me/posts", expose: true, auth: true },
  async (req: CreatePostRequest): Promise<PostResponse> => {
    const auth = getAuthData()!;
    const post = await service.createMyPost(auth.walletAddress, req);
    return service.toPostResponse(post);
  },
);

export const listMyPosts = api(
  { method: "GET", path: "/me/posts", expose: true, auth: true },
  async (): Promise<{ posts: PostResponse[] }> => {
    const auth = getAuthData()!;
    const posts = await service.listMyPosts(auth.walletAddress);
    return { posts: posts.map(service.toPostResponse) };
  },
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
  },
);

export const deleteMyPost = api(
  { method: "DELETE", path: "/me/posts/:postId", expose: true, auth: true },
  async ({ postId }: { postId: string }): Promise<void> => {
    const auth = getAuthData()!;
    await service.deleteMyPost(auth.walletAddress, postId);
  },
);

interface ListAuthorPostsRequest {
  slug: string;
  authorization?: Header<"Authorization">;
}

export const listAuthorPosts = api(
  { method: "GET", path: "/authors/:slug/posts", expose: true },
  async ({
    slug,
    authorization,
  }: ListAuthorPostsRequest): Promise<{ posts: FeedPostResponse[] }> => {
    const viewerWallet = await getOptionalViewerWallet(authorization);
    const posts = await service.listAuthorPostsBySlug(slug, viewerWallet);
    return { posts };
  },
);

interface GetAuthorPostRequest {
  slug: string;
  postId: string;
  authorization?: Header<"Authorization">;
}

export const getAuthorPost = api(
  { method: "GET", path: "/authors/:slug/posts/:postId", expose: true },
  async ({
    slug,
    postId,
    authorization,
  }: GetAuthorPostRequest): Promise<PostResponse> => {
    const viewerWallet = await getOptionalViewerWallet(authorization);
    const post = await service.getAuthorPostBySlugAndId(
      slug,
      postId,
      viewerWallet,
    );
    return service.toPostResponse(post);
  },
);

export const createMyProject = api(
  { method: "POST", path: "/me/projects", expose: true, auth: true },
  async (req: CreateProjectRequest): Promise<ProjectResponse> => {
    const auth = getAuthData()!;
    const project = await service.createMyProject(auth.walletAddress, req);
    return service.toProjectResponse(project);
  },
);

export const listMyProjects = api(
  { method: "GET", path: "/me/projects", expose: true, auth: true },
  async (): Promise<{ projects: ProjectResponse[] }> => {
    const auth = getAuthData()!;
    const projects = await service.listMyProjects(auth.walletAddress);
    return { projects: projects.map(service.toProjectResponse) };
  },
);

export const updateMyProject = api(
  {
    method: "PATCH",
    path: "/me/projects/:projectId",
    expose: true,
    auth: true,
  },
  async ({
    projectId,
    ...req
  }: UpdateProjectRequest & {
    projectId: string;
  }): Promise<ProjectResponse> => {
    const auth = getAuthData()!;
    const project = await service.updateMyProject(
      auth.walletAddress,
      projectId,
      req,
    );
    return service.toProjectResponse(project);
  },
);

export const deleteMyProject = api(
  {
    method: "DELETE",
    path: "/me/projects/:projectId",
    expose: true,
    auth: true,
  },
  async ({ projectId }: { projectId: string }): Promise<void> => {
    const auth = getAuthData()!;
    await service.deleteMyProject(auth.walletAddress, projectId);
  },
);

interface ListProjectNodesRequest {
  projectId: string;
  parentId?: string | null;
}

export const listMyProjectNodes = api(
  {
    method: "GET",
    path: "/me/projects/:projectId/nodes",
    expose: true,
    auth: true,
  },
  async ({
    projectId,
    parentId,
  }: ListProjectNodesRequest): Promise<ProjectNodeListResponse> => {
    const auth = getAuthData()!;
    return service.listMyProjectNodes(auth.walletAddress, projectId, parentId);
  },
);

export const createMyProjectFolder = api(
  {
    method: "POST",
    path: "/me/projects/:projectId/folders",
    expose: true,
    auth: true,
  },
  async ({
    projectId,
    ...req
  }: CreateProjectFolderRequest & {
    projectId: string;
  }): Promise<ProjectNodeResponse> => {
    const auth = getAuthData()!;
    const folder = await service.createMyProjectFolder(
      auth.walletAddress,
      projectId,
      req,
    );
    return service.toProjectNodeResponse(folder);
  },
);

export const updateMyProjectNode = api(
  {
    method: "PATCH",
    path: "/me/projects/:projectId/nodes/:nodeId",
    expose: true,
    auth: true,
  },
  async ({
    projectId,
    nodeId,
    ...req
  }: UpdateProjectNodeRequest & {
    projectId: string;
    nodeId: string;
  }): Promise<ProjectNodeResponse> => {
    const auth = getAuthData()!;
    const node = await service.updateMyProjectNode(
      auth.walletAddress,
      projectId,
      nodeId,
      req,
    );
    return service.toProjectNodeResponse(node);
  },
);

export const deleteMyProjectNode = api(
  {
    method: "DELETE",
    path: "/me/projects/:projectId/nodes/:nodeId",
    expose: true,
    auth: true,
  },
  async ({
    projectId,
    nodeId,
  }: {
    projectId: string;
    nodeId: string;
  }): Promise<void> => {
    const auth = getAuthData()!;
    await service.deleteMyProjectNode(auth.walletAddress, projectId, nodeId);
  },
);

export const uploadMyProjectFile = api.raw(
  {
    method: "POST",
    path: "/me/project-files/upload/*projectId",
    expose: true,
    auth: true,
  },
  async (req, resp) => {
    const auth = getAuthData()!;
    const url = new URL(req.url ?? "", "http://localhost");
    const projectId = url.pathname.replace("/me/project-files/upload/", "");
    const name = url.searchParams.get("name") ?? "";
    const parentId = url.searchParams.get("parentId");
    const body = await readRequestBody(req);
    const contentType = String(
      req.headers["content-type"] ?? "application/octet-stream",
    );
    const node = await service.uploadMyProjectFile(
      auth.walletAddress,
      projectId,
      {
        parentId,
        name,
        body,
        contentType,
      },
    );

    resp.writeHead(200, { "Content-Type": "application/json" });
    resp.end(JSON.stringify(service.toProjectNodeResponse(node)));
  },
);

export const downloadMyProjectFile = api.raw(
  {
    method: "GET",
    path: "/me/project-files/download/*path",
    expose: true,
    auth: true,
  },
  async (req, resp) => {
    const auth = getAuthData()!;
    const [projectId, nodeId] = parseFilePath(
      req.url ?? "",
      "/me/project-files/download/",
    );
    const file = await service.getMyProjectFile(
      auth.walletAddress,
      projectId,
      nodeId,
    );
    writeFileResponse(resp, file);
  },
);

function assertDeploymentRegistryToken(
  deploymentRegistryToken: string | undefined,
): void {
  const expected = getDeploymentRegistryToken();
  if (!expected || deploymentRegistryToken !== expected) {
    throw APIError.permissionDenied("invalid deployment registry token");
  }
}

function getDeploymentRegistryToken(): string {
  try {
    return deploymentRegistryToken();
  } catch {
    return process.env.DEPLOYMENT_REGISTRY_TOKEN ?? "";
  }
}

interface ListAuthorProjectsRequest {
  slug: string;
  authorization?: Header<"Authorization">;
}

export const listAuthorProjects = api(
  { method: "GET", path: "/authors/:slug/projects", expose: true },
  async ({
    slug,
    authorization,
  }: ListAuthorProjectsRequest): Promise<{
    projects: FeedProjectResponse[];
  }> => {
    const viewerWallet = await getOptionalViewerWallet(authorization);
    const projects = await service.listAuthorProjectsBySlug(slug, viewerWallet);
    return { projects };
  },
);

interface GetAuthorProjectRequest {
  slug: string;
  projectId: string;
  authorization?: Header<"Authorization">;
}

export const getAuthorProject = api(
  { method: "GET", path: "/authors/:slug/projects/:projectId", expose: true },
  async ({
    slug,
    projectId,
    authorization,
  }: GetAuthorProjectRequest): Promise<ProjectResponse> => {
    const viewerWallet = await getOptionalViewerWallet(authorization);
    const project = await service.getAuthorProjectBySlugAndId(
      slug,
      projectId,
      viewerWallet,
    );
    return service.toProjectResponse(project);
  },
);

interface ListAuthorProjectNodesRequest {
  slug: string;
  projectId: string;
  parentId?: string | null;
  authorization?: Header<"Authorization">;
}

export const listAuthorProjectNodes = api(
  {
    method: "GET",
    path: "/authors/:slug/projects/:projectId/nodes",
    expose: true,
  },
  async ({
    slug,
    projectId,
    parentId,
    authorization,
  }: ListAuthorProjectNodesRequest): Promise<ProjectNodeListResponse> => {
    const viewerWallet = await getOptionalViewerWallet(authorization);
    return service.listAuthorProjectNodesBySlug(
      slug,
      projectId,
      parentId,
      viewerWallet,
    );
  },
);

export const downloadAuthorProjectFile = api.raw(
  {
    method: "GET",
    path: "/project-files/download/*path",
    expose: true,
  },
  async (req, resp) => {
    const [slug, projectId, nodeId] = parseFilePath(
      req.url ?? "",
      "/project-files/download/",
    );
    const viewerWallet = await getOptionalViewerWallet(
      String(req.headers.authorization ?? ""),
    );
    const file = await service.getAuthorProjectFileBySlug(
      slug,
      projectId,
      nodeId,
      viewerWallet,
    );
    writeFileResponse(resp, file);
  },
);

async function getOptionalViewerWallet(
  authorization?: string,
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

async function readRequestBody(req: AsyncIterable<string | Buffer | Uint8Array>) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(toBuffer(chunk));
  }
  return Buffer.concat(chunks);
}

function parseFilePath(url: string, prefix: string): string[] {
  const path = new URL(url, "http://localhost").pathname.replace(prefix, "");
  return path.split("/").filter(Boolean).map(decodeURIComponent);
}

function writeFileResponse(
  resp: {
    writeHead: (statusCode: number, headers: Record<string, string>) => void;
    end: (chunk?: Buffer) => void;
  },
  file: { body: Buffer; contentType: string; fileName: string },
): void {
  resp.writeHead(200, {
    "Content-Type": file.contentType,
    "Content-Length": String(file.body.length),
    "Content-Disposition": `attachment; filename="${encodeURIComponent(
      file.fileName,
    )}"`,
  });
  resp.end(file.body);
}

function toBuffer(chunk: string | Buffer | Uint8Array): Buffer {
  if (typeof chunk === "string") {
    return Buffer.from(chunk);
  }
  if (Buffer.isBuffer(chunk)) {
    return chunk;
  }
  return Buffer.from(chunk);
}
