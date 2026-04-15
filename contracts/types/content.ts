import type { AccessPolicy, PolicyMode } from "./access"

export interface UserWalletDto {
    address: string
    kind: "primary" | "secondary"
    addedAt: string
}

export interface UserProfileDto {
    id: string
    username: string | null
    displayName: string
    bio: string
    avatarFileId: string | null
    primaryWallet: string
    wallets: UserWalletDto[]
    role: "user" | "admin"
    createdAt: string
    updatedAt: string
}

export interface AuthorProfileDto {
    id: string
    userId: string
    slug: string
    displayName: string
    bio: string
    avatarFileId: string | null
    subscriptionPlanId: string | null
    createdAt: string
    updatedAt: string
}

export interface SubscriptionEntitlementDto {
    id: string
    authorId: string
    subscriberWallet: string
    planId: string
    status: "active" | "expired"
    validUntil: string
    source: "onchain"
    createdAt: string
    updatedAt: string
}

export interface SubscriptionPlanDto {
    id: string
    authorId: string
    code: string
    title: string
    chainId: number
    tokenAddress: string
    price: string
    billingPeriodDays: number
    contractAddress: string
    active: boolean
    createdAt: string
    updatedAt: string
}

export interface PostDto {
    id: string
    authorId: string
    title: string
    content: string
    status: "draft" | "published"
    policyMode: PolicyMode
    policy: AccessPolicy | null
    attachmentIds: string[]
    publishedAt: string | null
    createdAt: string
    updatedAt: string
}

export interface ProjectDto {
    id: string
    authorId: string
    title: string
    description: string
    status: "draft" | "published"
    policyMode: PolicyMode
    policy: AccessPolicy | null
    rootNodeId: string
    publishedAt: string | null
    createdAt: string
    updatedAt: string
}

export interface UpdateMyProfileInput {
    username?: string | null
    displayName?: string
    bio?: string
}

export interface CreateAuthorProfileInput {
    slug: string
    displayName: string
    bio?: string
}

export interface UpsertSubscriptionPlanInput {
    title: string
    chainId: number
    tokenAddress: string
    price: string
    billingPeriodDays: number
    contractAddress: string
    active?: boolean
}

export interface CreatePostInput {
    title: string
    content: string
    status?: "draft" | "published"
    policyMode?: PolicyMode
    policy?: AccessPolicy | null
    attachmentIds?: string[]
}

export interface CreateProjectInput {
    title: string
    description?: string
    status?: "draft" | "published"
    policyMode?: PolicyMode
    policy?: AccessPolicy | null
}
