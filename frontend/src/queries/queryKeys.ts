export const queryKeys = {
    me: ["me"] as const,
    myAuthor: ["me", "author"] as const,
    myPosts: ["me", "posts"] as const,
    myProjects: ["me", "projects"] as const,
    myEntitlements: ["me", "entitlements"] as const,
    mySubscriptionPlan: ["me", "subscription-plan"] as const,
    author: (slug: string) => ["authors", slug] as const,
    authorPosts: (slug: string) => ["authors", slug, "posts"] as const,
    authorProjects: (slug: string) => ["authors", slug, "projects"] as const,
    authorSubscriptionPlan: (slug: string) => ["authors", slug, "subscription-plan"] as const,
} as const
