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
  AuthorStorageUsageResponse,
  AuthorSubscriberResponse,
  ConfirmSubscriptionPaymentRequest,
  ContractDeploymentLookupResponse,
  ContractDeploymentResponse,
  CreateAccessPolicyPresetRequest,
  CreateAuthorProfileRequest,
  CreatePostCommentRequest,
  CreatePostRequest,
  CreateProjectFolderRequest,
  CreateProjectRequest,
  CreateSubscriptionPaymentIntentRequest,
  FeedPostResponse,
  FeedProjectResponse,
  PostCommentResponse,
  PostResponse,
  ProjectBundleResponse,
  ProjectNodeListResponse,
  ProjectNodeResponse,
  ProjectResponse,
  ReaderSubscriptionResponse,
  RecordPostViewRequest,
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

export const listMyAccessPolicyPresets = api(
  { method: "GET", path: "/me/access-policies", expose: true, auth: true },
  async (): Promise<{ policies: AccessPolicyPresetResponse[] }> => {
    const auth = getAuthData()!;
    const policies = await service.listMyAccessPolicyPresetResponses(
      auth.walletAddress,
    );
    return { policies };
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
    return service.toSubscriptionPlanResponseWithStats(plan);
  },
);

export const listMySubscriptionPlans = api(
  { method: "GET", path: "/me/subscription-plans", expose: true, auth: true },
  async (): Promise<{ plans: SubscriptionPlanResponse[] }> => {
    const auth = getAuthData()!;
    const plans = await service.listMySubscriptionPlans(auth.walletAddress);
    return {
      plans: await Promise.all(
        plans.map((plan) => service.toSubscriptionPlanResponseWithStats(plan)),
      ),
    };
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
    return service.toSubscriptionPlanResponseWithStats(plan);
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
    return service.toSubscriptionPlanResponseWithStats(plan);
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
    return {
      plans: await Promise.all(
        plans.map((plan) => service.toSubscriptionPlanResponseWithStats(plan)),
      ),
    };
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
    return service.buildPostResponse(post, auth.walletAddress);
  },
);

interface ListMyPostsRequest {
  status?: "draft" | "published" | "archived";
}

export const listMyPosts = api(
  { method: "GET", path: "/me/posts", expose: true, auth: true },
  async ({
    status,
  }: ListMyPostsRequest): Promise<{ posts: PostResponse[] }> => {
    const auth = getAuthData()!;
    const posts =
      status === "archived"
        ? await service.listMyArchivedPosts(auth.walletAddress)
        : await service.listMyPosts(auth.walletAddress);
    return {
      posts: await Promise.all(
        posts.map((post) =>
          service.buildPostResponse(post, auth.walletAddress),
        ),
      ),
    };
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
    return service.buildPostResponse(post, auth.walletAddress);
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
    return service.buildPostResponse(post, viewerWallet);
  },
);

export const listPostComments = api(
  {
    method: "GET",
    path: "/authors/:slug/posts/:postId/comments",
    expose: true,
  },
  async ({
    slug,
    postId,
    authorization,
  }: GetAuthorPostRequest): Promise<{ comments: PostCommentResponse[] }> => {
    const viewerWallet = await getOptionalViewerWallet(authorization);
    const comments = await service.listPostCommentsBySlug(
      slug,
      postId,
      viewerWallet,
    );
    return { comments: comments.map(service.toPostCommentResponse) };
  },
);

export const createPostComment = api(
  {
    method: "POST",
    path: "/authors/:slug/posts/:postId/comments",
    expose: true,
    auth: true,
  },
  async ({
    slug,
    postId,
    ...req
  }: CreatePostCommentRequest & {
    slug: string;
    postId: string;
  }): Promise<PostCommentResponse> => {
    const auth = getAuthData()!;
    const comment = await service.createPostCommentBySlug(
      slug,
      postId,
      auth.walletAddress,
      req,
    );
    return service.toPostCommentResponse(comment);
  },
);

export const togglePostLike = api(
  {
    method: "POST",
    path: "/authors/:slug/posts/:postId/like",
    expose: true,
    auth: true,
  },
  async ({
    slug,
    postId,
  }: {
    slug: string;
    postId: string;
  }): Promise<{ liked: boolean; likesCount: number }> => {
    const auth = getAuthData()!;
    return service.togglePostLikeBySlug(slug, postId, auth.walletAddress);
  },
);

export const recordPostView = api(
  {
    method: "POST",
    path: "/authors/:slug/posts/:postId/view",
    expose: true,
  },
  async ({
    slug,
    postId,
    authorization,
    ...req
  }: RecordPostViewRequest & {
    slug: string;
    postId: string;
    authorization?: Header<"Authorization">;
  }): Promise<{ viewsCount: number }> => {
    const viewerWallet = await getOptionalViewerWallet(authorization);
    return service.recordPostViewBySlug(
      slug,
      postId,
      req.viewerKey,
      viewerWallet,
    );
  },
);

export const uploadMyPostAttachment = api.raw(
  {
    method: "POST",
    path: "/me/post-files/upload/*postId",
    expose: true,
    auth: true,
  },
  async (req, resp) => {
    const auth = getAuthData()!;
    const url = new URL(req.url ?? "", "http://localhost");
    const postId = url.pathname.replace("/me/post-files/upload/", "");
    const name = url.searchParams.get("name") ?? "";
    const body = await readRequestBody(req);
    const contentType = String(
      req.headers["content-type"] ?? "application/octet-stream",
    );
    const attachment = await service.uploadMyPostAttachment(
      auth.walletAddress,
      postId,
      { name, body, contentType },
    );

    resp.writeHead(200, { "Content-Type": "application/json" });
    resp.end(JSON.stringify(service.toPostAttachmentResponse(attachment)));
  },
);

export const downloadMyPostAttachment = api.raw(
  {
    method: "GET",
    path: "/me/post-files/download/*path",
    expose: true,
    auth: true,
  },
  async (req, resp) => {
    const auth = getAuthData()!;
    const [postId, attachmentId] = parseFilePath(
      req.url ?? "",
      "/me/post-files/download/",
    );
    const file = await service.getMyPostAttachment(
      auth.walletAddress,
      postId,
      attachmentId,
    );
    writeFileResponse(resp, file);
  },
);

export const createMyProject = api(
  { method: "POST", path: "/me/projects", expose: true, auth: true },
  async (req: CreateProjectRequest): Promise<ProjectResponse> => {
    const auth = getAuthData()!;
    const project = await service.createMyProject(auth.walletAddress, req);
    return service.buildProjectResponse(project);
  },
);

export const listMyProjects = api(
  { method: "GET", path: "/me/projects", expose: true, auth: true },
  async ({
    status,
  }: ListMyPostsRequest): Promise<{ projects: ProjectResponse[] }> => {
    const auth = getAuthData()!;
    const projects =
      status === "archived"
        ? await service.listMyArchivedProjects(auth.walletAddress)
        : await service.listMyProjects(auth.walletAddress);
    return {
      projects: await Promise.all(projects.map(service.buildProjectResponse)),
    };
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
    return service.buildProjectResponse(project);
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
    path: "/me/project-nodes",
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
    path: "/me/project-folders",
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
    path: "/me/project-nodes/:nodeId",
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
    path: "/me/project-nodes/:nodeId",
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

export const getMyProjectBundle = api(
  {
    method: "GET",
    path: "/me/project-bundle",
    expose: true,
    auth: true,
  },
  async ({
    projectId,
    folderId,
  }: {
    projectId: string;
    folderId?: string | null;
  }): Promise<ProjectBundleResponse> => {
    const auth = getAuthData()!;
    return service.getMyProjectBundle(auth.walletAddress, projectId, folderId);
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
    return service.buildProjectResponse(project);
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
    path: "/author-project-nodes",
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

export const getAuthorProjectBundle = api(
  {
    method: "GET",
    path: "/author-project-bundle",
    expose: true,
  },
  async ({
    slug,
    projectId,
    folderId,
    authorization,
  }: {
    slug: string;
    projectId: string;
    folderId?: string | null;
    authorization?: Header<"Authorization">;
  }): Promise<ProjectBundleResponse> => {
    const viewerWallet = await getOptionalViewerWallet(authorization);
    return service.getAuthorProjectBundleBySlug(
      slug,
      projectId,
      folderId,
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

export const downloadAuthorPostAttachment = api.raw(
  {
    method: "GET",
    path: "/post-files/download/*path",
    expose: true,
  },
  async (req, resp) => {
    const [slug, postId, attachmentId] = parseFilePath(
      req.url ?? "",
      "/post-files/download/",
    );
    const viewerWallet = await getOptionalViewerWallet(
      String(req.headers.authorization ?? ""),
    );
    const file = await service.getAuthorPostAttachmentBySlug(
      slug,
      postId,
      attachmentId,
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

async function readRequestBody(
  req: AsyncIterable<string | Buffer | Uint8Array>,
) {
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
