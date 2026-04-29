import type { AccessPolicyConditionDto, AccessPolicyPresetDto, AuthorAccessPolicyDto, CreateAccessPolicyPresetInput, UpdateAccessPolicyPresetInput } from "../../shared/types/access"
import type { ActivityDto, CreatePostCommentInput, CreatePostInput, CreatePostReportInput, FeedPostDto, PostAttachmentDto, PostCommentDto, PostDto, PostReportDto, RecordPostViewInput, UpdatePostInput } from "../../shared/types/posts"
import type { AuthorCatalogItemDto, AuthorProfileDto, AuthorStorageUsageDto, CreateAuthorProfileInput, UpdateAuthorProfileInput, UpdateMyProfileInput, UserProfileDto } from "../../shared/types/profile"
import type { AuthorPlatformBillingDto, AuthorPlatformCleanupItemDto, AuthorPlatformCleanupPreviewDto, AuthorPlatformCleanupRunDto, CreatePlatformSubscriptionPaymentIntentInput, PlatformPlanDto, PlatformSubscriptionPaymentIntentDto } from "../../shared/types/platform"
import type { AuthorSubscriberDto, ConfirmSubscriptionPaymentInput, CreateSubscriptionPaymentIntentInput, ReaderSubscriptionDto, SubscriptionEntitlementDto, SubscriptionPaymentIntentDto, SubscriptionPlanDto, UpsertSubscriptionPlanInput } from "../../shared/types/subscriptions"
import type { ContractDeploymentDto, ContractDeploymentLookupDto, UpsertContractDeploymentInput } from "../../shared/types/contracts"
import type { CreateProjectFolderInput, CreateProjectInput, FeedProjectDto, ProjectBundleDto, ProjectDto, ProjectNodeDto, ProjectNodeListDto, UpdateProjectInput, UpdateProjectNodeInput } from "../../shared/types/projects"
import type { PlatformFeature } from "../../shared/consts"

export type {
  PlatformBillingStatus,
  PlatformFeature,
} from "../../shared/consts";

export type { AccessPolicyPresetDoc } from "../access/doc-types";
export type { ActivityDoc } from "../activity/doc-types";
export type { ContractDeploymentDoc } from "../contracts/doc-types";
export type {
  AuthorPlatformCleanupLogDoc,
  AuthorPlatformSubscriptionDoc,
  AuthorStorageUsageStats,
  PlatformPlanDoc,
  PlatformSubscriptionPaymentIntentDoc,
} from "../platform/doc-types";
export type {
  AuthorProfileDoc,
  UserDoc,
  UserWalletDoc,
} from "../profiles/doc-types";
export type {
  PostAttachmentDoc,
  PostCommentDoc,
  PostDoc,
  PostLikeDoc,
  PostReportDoc,
  PostViewDoc,
} from "../posts/doc-types";
export type { ProjectDoc, ProjectNodeDoc } from "../projects/doc-types";
export type {
  SubscriptionEntitlementDoc,
  SubscriptionPaymentIntentDoc,
  SubscriptionPlanDoc,
} from "../subscriptions/doc-types";

export type UserProfileResponse = UserProfileDto;
export type ActivityResponse = ActivityDto;
export type AuthorProfileResponse = AuthorProfileDto;
export type AuthorStorageUsageResponse = AuthorStorageUsageDto;
export type AuthorPlatformBillingResponse = AuthorPlatformBillingDto;
export type AuthorPlatformCleanupPreviewResponse =
  AuthorPlatformCleanupPreviewDto;
export type AuthorPlatformCleanupItemResponse = AuthorPlatformCleanupItemDto;
export type AuthorPlatformCleanupRunResponse = AuthorPlatformCleanupRunDto;
export type PlatformPlanResponse = PlatformPlanDto;
export type AuthorCatalogItemResponse = AuthorCatalogItemDto;
export type AuthorAccessPolicyResponse = AuthorAccessPolicyDto;
export type AccessPolicyConditionResponse = AccessPolicyConditionDto;
export type AuthorSubscriberResponse = AuthorSubscriberDto;
export type AccessPolicyPresetResponse = AccessPolicyPresetDto;
export type SubscriptionEntitlementResponse = SubscriptionEntitlementDto;
export type ReaderSubscriptionResponse = ReaderSubscriptionDto;
export type FeedPostResponse = FeedPostDto;
export type PostCommentResponse = PostCommentDto;
export type PostReportResponse = PostReportDto;
export type PostAttachmentResponse = PostAttachmentDto;
export type FeedProjectResponse = FeedProjectDto;
export type ContractDeploymentResponse = ContractDeploymentDto;
export type ContractDeploymentLookupResponse = ContractDeploymentLookupDto;
export type SubscriptionPaymentIntentResponse = SubscriptionPaymentIntentDto;
export type PlatformSubscriptionPaymentIntentResponse =
  PlatformSubscriptionPaymentIntentDto;
export type SubscriptionPlanResponse = SubscriptionPlanDto;
export type PostResponse = PostDto;
export type ProjectResponse = ProjectDto;
export type ProjectBundleResponse = ProjectBundleDto;
export type ProjectNodeResponse = ProjectNodeDto;
export type ProjectNodeListResponse = ProjectNodeListDto;
export type UpdateMyProfileRequest = UpdateMyProfileInput;
export type CreateAccessPolicyPresetRequest = CreateAccessPolicyPresetInput;
export type UpdateAccessPolicyPresetRequest = UpdateAccessPolicyPresetInput;
export type CreateAuthorProfileRequest = CreateAuthorProfileInput;
export type UpdateAuthorProfileRequest = UpdateAuthorProfileInput;
export type UpsertSubscriptionPlanRequest = UpsertSubscriptionPlanInput;
export type CreatePostRequest = CreatePostInput;
export type UpdatePostRequest = UpdatePostInput;
export type CreatePostCommentRequest = CreatePostCommentInput;
export type CreatePostReportRequest = CreatePostReportInput;
export type RecordPostViewRequest = RecordPostViewInput;
export type CreateProjectRequest = CreateProjectInput;
export type UpdateProjectRequest = UpdateProjectInput;
export type CreateProjectFolderRequest = CreateProjectFolderInput;
export type UpdateProjectNodeRequest = UpdateProjectNodeInput;
export type CreateSubscriptionPaymentIntentRequest =
  CreateSubscriptionPaymentIntentInput;
export type CreatePlatformSubscriptionPaymentIntentRequest =
  CreatePlatformSubscriptionPaymentIntentInput;
export type ConfirmSubscriptionPaymentRequest = ConfirmSubscriptionPaymentInput;
export type UpsertContractDeploymentRequest = UpsertContractDeploymentInput;
export type PlatformPlanCode = PlatformPlanDto["code"];
export type PlatformFeatureCode = PlatformFeature;
