export const queryKeys = {
    me: ["me"] as const,
    myAuthor: ["me", "author"] as const,
    myPosts: (status?: string) => ["me", "posts", status ?? "active"] as const,
    myProjects: (status?: string) => ["me", "projects", status ?? "active"] as const,
    myEntitlements: ["me", "entitlements"] as const,
    myReaderSubscriptions: ["me", "subscriptions"] as const,
    myFeedPosts: ["me", "feed"] as const,
    myAuthorSubscribers: ["me", "author", "subscribers"] as const,
    myAccessPolicies: ["me", "access-policies"] as const,
    mySubscriptionPlan: ["me", "subscription-plan"] as const,
    mySubscriptionPlans: ["me", "subscription-plans"] as const,
    authors: (search = "") => ["authors", search] as const,
    subscriptionManagerDeployment: (chainId: number) =>
        ["contract-deployments", "subscription-manager", chainId] as const,
    author: (slug: string) => ["authors", slug] as const,
    authorAccessPolicies: (slug: string) => ["authors", slug, "access-policies"] as const,
    authorPosts: (slug: string) => ["authors", slug, "posts"] as const,
    authorPost: (slug: string, postId: string) => ["authors", slug, "posts", postId] as const,
    postComments: (slug: string, postId: string) =>
        ["authors", slug, "posts", postId, "comments"] as const,
    authorProjects: (slug: string) => ["authors", slug, "projects"] as const,
    authorProject: (slug: string, projectId: string) =>
        ["authors", slug, "projects", projectId] as const,
    authorProjectNodes: (slug: string, projectId: string, parentId?: string | null) =>
        ["authors", slug, "projects", projectId, "nodes", parentId ?? "root"] as const,
    myProjectNodes: (projectId: string, parentId?: string | null) =>
        ["me", "projects", projectId, "nodes", parentId ?? "root"] as const,
    authorSubscriptionPlan: (slug: string) => ["authors", slug, "subscription-plan"] as const,
    authorSubscriptionPlans: (slug: string) => ["authors", slug, "subscription-plans"] as const,
} as const
