export const SHARED_SCHEMA_VERSION = 1;

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export type PaymentAsset = "erc20" | "native";

export const PAYMENT_ASSET = {
  ERC20: "erc20",
  NATIVE: "native",
} as const satisfies Record<string, PaymentAsset>;

export const PAYMENT_ASSETS: readonly PaymentAsset[] = [
  PAYMENT_ASSET.ERC20,
  PAYMENT_ASSET.NATIVE,
];

export type ContentStatus = "draft" | "published" | "archived";

export const CONTENT_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const satisfies Record<string, ContentStatus>;

export const CONTENT_STATUSES: readonly ContentStatus[] = [
  CONTENT_STATUS.DRAFT,
  CONTENT_STATUS.PUBLISHED,
  CONTENT_STATUS.ARCHIVED,
];

export type PolicyMode = "public" | "inherited" | "custom";

export const POLICY_MODE = {
  PUBLIC: "public",
  INHERITED: "inherited",
  CUSTOM: "custom",
} as const satisfies Record<string, PolicyMode>;

export const POLICY_MODES: readonly PolicyMode[] = [
  POLICY_MODE.PUBLIC,
  POLICY_MODE.INHERITED,
  POLICY_MODE.CUSTOM,
];

export type AccessPolicyNodeType =
  | "public"
  | "subscription"
  | "token_balance"
  | "nft_ownership"
  | "or"
  | "and";

export const ACCESS_POLICY_NODE_TYPE = {
  PUBLIC: "public",
  SUBSCRIPTION: "subscription",
  TOKEN_BALANCE: "token_balance",
  NFT_OWNERSHIP: "nft_ownership",
  OR: "or",
  AND: "and",
} as const satisfies Record<string, AccessPolicyNodeType>;

export type AccessConditionMode = "single" | "and" | "or";

export const ACCESS_CONDITION_MODE = {
  SINGLE: "single",
  AND: "and",
  OR: "or",
} as const satisfies Record<string, AccessConditionMode>;

export type AccessComposer = "public" | AccessConditionMode;

export const ACCESS_COMPOSER = {
  PUBLIC: "public",
  SINGLE: ACCESS_CONDITION_MODE.SINGLE,
  AND: ACCESS_CONDITION_MODE.AND,
  OR: ACCESS_CONDITION_MODE.OR,
} as const satisfies Record<string, AccessComposer>;

export const ACCESS_COMPOSERS: readonly AccessComposer[] = [
  ACCESS_COMPOSER.PUBLIC,
  ACCESS_COMPOSER.SINGLE,
  ACCESS_COMPOSER.AND,
  ACCESS_COMPOSER.OR,
];

export type NftStandard = "erc721" | "erc1155";

export const NFT_STANDARD = {
  ERC721: "erc721",
  ERC1155: "erc1155",
} as const satisfies Record<string, NftStandard>;

export type ContentVisibility = "author" | "published";

export const CONTENT_VISIBILITY = {
  AUTHOR: "author",
  PUBLISHED: "published",
} as const satisfies Record<string, ContentVisibility>;

export type ProjectNodeKind = "file" | "folder";

export const PROJECT_NODE_KIND = {
  FILE: "file",
  FOLDER: "folder",
} as const satisfies Record<string, ProjectNodeKind>;

export type UserWalletKind = "primary" | "secondary";

export const USER_WALLET_KIND = {
  PRIMARY: "primary",
  SECONDARY: "secondary",
} as const satisfies Record<string, UserWalletKind>;

export type UserRole = "user" | "admin";

export const USER_ROLE = {
  USER: "user",
  ADMIN: "admin",
} as const satisfies Record<string, UserRole>;

export type PlatformPlanCode = "free" | "basic";

export const PLATFORM_PLAN_CODE = {
  FREE: "free",
  BASIC: "basic",
} as const satisfies Record<string, PlatformPlanCode>;

export const PLATFORM_PLAN_CODES: readonly PlatformPlanCode[] = [
  PLATFORM_PLAN_CODE.FREE,
  PLATFORM_PLAN_CODE.BASIC,
];

export type PlatformFeature = "posts" | "projects" | "homepage_promo";

export const PLATFORM_FEATURE = {
  POSTS: "posts",
  PROJECTS: "projects",
  HOMEPAGE_PROMO: "homepage_promo",
} as const satisfies Record<string, PlatformFeature>;

export const PLATFORM_FEATURES: readonly PlatformFeature[] = [
  PLATFORM_FEATURE.POSTS,
  PLATFORM_FEATURE.PROJECTS,
  PLATFORM_FEATURE.HOMEPAGE_PROMO,
];

export type PlatformBillingStatus = "free" | "active" | "grace" | "expired";

export const PLATFORM_BILLING_STATUS = {
  FREE: "free",
  ACTIVE: "active",
  GRACE: "grace",
  EXPIRED: "expired",
} as const satisfies Record<string, PlatformBillingStatus>;

export type CleanupItemKind = "post_attachment" | "project_file";

export const CLEANUP_ITEM_KIND = {
  POST_ATTACHMENT: "post_attachment",
  PROJECT_FILE: "project_file",
} as const satisfies Record<string, CleanupItemKind>;

export type CleanupRunStatus = "skipped" | "completed";

export const CLEANUP_RUN_STATUS = {
  SKIPPED: "skipped",
  COMPLETED: "completed",
} as const satisfies Record<string, CleanupRunStatus>;

export type PaymentIntentStatus =
  | "pending"
  | "submitted"
  | "confirmed"
  | "expired"
  | "cancelled";

export const PAYMENT_INTENT_STATUS = {
  PENDING: "pending",
  SUBMITTED: "submitted",
  CONFIRMED: "confirmed",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
} as const satisfies Record<string, PaymentIntentStatus>;

export type SubscriptionEntitlementStatus = "active" | "expired";

export const SUBSCRIPTION_ENTITLEMENT_STATUS = {
  ACTIVE: "active",
  EXPIRED: "expired",
} as const satisfies Record<string, SubscriptionEntitlementStatus>;

export type SubscriptionEntitlementSource = "onchain";

export const SUBSCRIPTION_ENTITLEMENT_SOURCE = {
  ONCHAIN: "onchain",
} as const satisfies Record<string, SubscriptionEntitlementSource>;

export type PostReportReason =
  | "spam"
  | "scam"
  | "illegal_content"
  | "abuse"
  | "other";

export const POST_REPORT_REASON = {
  SPAM: "spam",
  SCAM: "scam",
  ILLEGAL_CONTENT: "illegal_content",
  ABUSE: "abuse",
  OTHER: "other",
} as const satisfies Record<string, PostReportReason>;

export type PostReportStatus = "open" | "reviewed" | "dismissed";

export const POST_REPORT_STATUS = {
  OPEN: "open",
  REVIEWED: "reviewed",
  DISMISSED: "dismissed",
} as const satisfies Record<string, PostReportStatus>;

export type ActivityType =
  | "post_liked"
  | "post_commented"
  | "new_subscription"
  | "new_post";

export const ACTIVITY_TYPE = {
  POST_LIKED: "post_liked",
  POST_COMMENTED: "post_commented",
  NEW_SUBSCRIPTION: "new_subscription",
  NEW_POST: "new_post",
} as const satisfies Record<string, ActivityType>;

export type PostAttachmentKind = "image" | "video" | "audio" | "file";

export const POST_ATTACHMENT_KIND = {
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
  FILE: "file",
} as const satisfies Record<string, PostAttachmentKind>;

export type FeedSource = "public" | "subscribed" | "promoted" | "author";

export const FEED_SOURCE = {
  PUBLIC: "public",
  SUBSCRIBED: "subscribed",
  PROMOTED: "promoted",
  AUTHOR: "author",
} as const satisfies Record<string, FeedSource>;

export type ContractName = "SubscriptionManager" | "PlatformSubscriptionManager";

export const CONTRACT_NAME = {
  SUBSCRIPTION_MANAGER: "SubscriptionManager",
  PLATFORM_SUBSCRIPTION_MANAGER: "PlatformSubscriptionManager",
} as const satisfies Record<string, ContractName>;
