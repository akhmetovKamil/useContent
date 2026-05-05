import type { AccessPolicyPresetDto, AuthorAccessPolicyDto } from "./access";
import type { PaginatedResponse } from "./common";
import type { AuthorCatalogItemDto } from "./profile";
import type {
  FeedPostDto,
  ActivityDto,
  PostCommentDto,
  PostDto,
} from "./posts";
import type { FeedProjectDto, ProjectDto } from "./projects";
import type {
  PlatformPlanDto,
} from "./platform";
import type {
  ReaderSubscriptionDto,
  AuthorDashboardDto,
  AuthorSubscriberDto,
  ReaderDashboardDto,
  SubscriptionEntitlementDto,
  SubscriptionPaymentIntentDto,
  SubscriptionPlanDto,
} from "./subscriptions";

export interface ListAccessPolicyPresetsResponseDto {
  policies: AccessPolicyPresetDto[];
}

export interface ListAuthorAccessPoliciesResponseDto {
  policies: AuthorAccessPolicyDto[];
}

export interface ListAuthorsResponseDto {
  authors: AuthorCatalogItemDto[];
}

export interface ListPlatformPlansResponseDto {
  plans: PlatformPlanDto[];
}

export interface ListPostsResponseDto {
  posts: PostDto[];
}

export type FeedPostPageResponseDto = PaginatedResponse<FeedPostDto>;

export interface ListPostCommentsResponseDto {
  comments: PostCommentDto[];
}

export interface TogglePostLikeResponseDto {
  liked: boolean;
  likesCount: number;
}

export interface RecordPostViewResponseDto {
  viewsCount: number;
}

export interface ListProjectsResponseDto {
  projects: ProjectDto[];
}

export interface ListAuthorProjectsResponseDto {
  projects: FeedProjectDto[];
}

export interface ListEntitlementsResponseDto {
  entitlements: SubscriptionEntitlementDto[];
}

export interface ListReaderSubscriptionsResponseDto {
  subscriptions: ReaderSubscriptionDto[];
}

export interface AuthorDashboardResponseDto {
  dashboard: AuthorDashboardDto;
}

export interface ReaderDashboardResponseDto {
  dashboard: ReaderDashboardDto;
}

export interface ListAuthorSubscribersResponseDto {
  subscribers: AuthorSubscriberDto[];
}

export interface ListSubscriptionPlansResponseDto {
  plans: SubscriptionPlanDto[];
}

export interface ListSubscriptionPaymentIntentsResponseDto {
  intents: SubscriptionPaymentIntentDto[];
}

export interface ListActivityResponseDto extends PaginatedResponse<ActivityDto> {}
