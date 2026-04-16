import { CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react"
import { useParams } from "react-router-dom"
import { formatUnits } from "viem"

import { PostFeed } from "@/components/posts/PostFeed"
import { SubscribeButton } from "@/components/subscriptions/SubscribeButton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthorAccessPoliciesQuery, useAuthorProfileQuery } from "@/queries/authors"
import { useAuthorPostsQuery } from "@/queries/posts"
import { useMyReaderSubscriptionsQuery } from "@/queries/profile"
import { useAuthorSubscriptionPlansQuery } from "@/queries/subscription-plans"
import { useAuthStore } from "@/stores/auth-store"
import { getTokenPresets } from "@/utils/config/tokens"

export function AuthorPage() {
    const { slug } = useParams()
    const authorSlug = slug ?? ""
    const token = useAuthStore((state) => state.token)
    const authorQuery = useAuthorProfileQuery(authorSlug)
    const postsQuery = useAuthorPostsQuery(authorSlug)
    const plansQuery = useAuthorSubscriptionPlansQuery(authorSlug)
    const policiesQuery = useAuthorAccessPoliciesQuery(authorSlug)
    const subscriptionsQuery = useMyReaderSubscriptionsQuery(Boolean(token))
    const activeSubscriptionByPlanId = new Map(
        (subscriptionsQuery.data ?? [])
            .filter(
                (subscription) =>
                    subscription.authorSlug === authorSlug &&
                    subscription.status === "active" &&
                    new Date(subscription.validUntil).getTime() > Date.now()
            )
            .map((subscription) => [subscription.planId, subscription])
    )

    return (
        <section className="grid gap-6">
            {authorQuery.isLoading ? (
                <Card className="rounded-[28px]">
                    <CardContent className="pt-6 text-[var(--muted)]">
                        Loading public profile...
                    </CardContent>
                </Card>
            ) : authorQuery.isError ? (
                <Card className="rounded-[28px]">
                    <CardContent className="pt-6 text-rose-600">
                        Author profile was not found: {authorQuery.error.message}
                    </CardContent>
                </Card>
            ) : authorQuery.data ? (
                <>
                    <Card className="overflow-hidden rounded-[32px]">
                        <CardHeader className="bg-[var(--accent-soft)]">
                            <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                                author profile
                            </div>
                            <CardTitle className="mt-2 font-[var(--serif)] text-4xl">
                                {authorQuery.data.displayName}
                            </CardTitle>
                            <CardDescription className="font-mono">@{authorSlug}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <p className="max-w-3xl text-[var(--muted)]">
                                {authorQuery.data.bio ||
                                    "The author has not added a profile description yet."}
                            </p>
                            {authorQuery.data.tags.length ? (
                                <div className="mt-5 flex flex-wrap gap-2">
                                    {authorQuery.data.tags.map((tag) => (
                                        <Badge className="rounded-full" key={tag}>
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>

                    <Card className="rounded-[28px]">
                        <CardHeader>
                            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                                <ShieldCheck className="size-4" />
                                access tiers
                            </div>
                            <CardTitle>Choose what you want to unlock</CardTitle>
                            <CardDescription>
                                Each tier is paid separately and may unlock different posts.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {plansQuery.isLoading ? (
                                <p className="text-sm text-[var(--muted)]">Loading tiers...</p>
                            ) : plansQuery.data?.length ? (
                                <div className="grid gap-4 lg:grid-cols-2">
                                    {plansQuery.data.map((plan) => {
                                        const subscription = activeSubscriptionByPlanId.get(plan.id)

                                        return (
                                            <article
                                                className="grid gap-4 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5"
                                                key={plan.id}
                                            >
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div>
                                                        <h3 className="text-xl font-medium text-[var(--foreground)]">
                                                            {plan.title}
                                                        </h3>
                                                        <p className="mt-1 text-sm text-[var(--muted)]">
                                                            {formatPlanPrice(
                                                                plan.chainId,
                                                                plan.tokenAddress,
                                                                plan.price,
                                                                plan.paymentAsset ?? "erc20"
                                                            )}{" "}
                                                            every {plan.billingPeriodDays} days
                                                        </p>
                                                    </div>
                                                    <Badge
                                                        className="rounded-full"
                                                        variant={
                                                            subscription ? "success" : "warning"
                                                        }
                                                    >
                                                        {subscription ? "active" : "not active"}
                                                    </Badge>
                                                </div>
                                                {subscription ? (
                                                    <p className="text-sm text-[var(--muted)]">
                                                        Active until{" "}
                                                        {formatDate(subscription.validUntil)}
                                                    </p>
                                                ) : null}
                                                <SubscribeButton
                                                    authorSlug={authorSlug}
                                                    plan={plan}
                                                />
                                            </article>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-[var(--muted)]">
                                    This author has no active subscription tiers yet.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-[28px]">
                        <CardHeader>
                            <CardTitle>Access conditions</CardTitle>
                            <CardDescription>
                                These rules decide which posts become visible for your wallet.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {policiesQuery.isLoading ? (
                                <p className="text-sm text-[var(--muted)]">Loading conditions...</p>
                            ) : policiesQuery.data?.length ? (
                                <div className="grid gap-3">
                                    {policiesQuery.data.map((policy) => (
                                        <article
                                            className="flex flex-col gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
                                            key={policy.id}
                                        >
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-base font-medium text-[var(--foreground)]">
                                                        {policy.name}
                                                    </span>
                                                    <Badge className="rounded-full">
                                                        {policy.accessLabel ??
                                                            policy.policy.root.type}
                                                    </Badge>
                                                    {policy.isDefault ? (
                                                        <Badge
                                                            className="rounded-full"
                                                            variant="success"
                                                        >
                                                            default
                                                        </Badge>
                                                    ) : null}
                                                </div>
                                                <p className="mt-2 text-sm text-[var(--muted)]">
                                                    {policy.description ||
                                                        "No extra description for this condition."}
                                                </p>
                                            </div>
                                            <Badge
                                                className="w-fit rounded-full"
                                                variant={policy.hasAccess ? "success" : "warning"}
                                            >
                                                {policy.hasAccess ? (
                                                    <CheckCircle2 className="mr-1 size-3.5" />
                                                ) : (
                                                    <LockKeyhole className="mr-1 size-3.5" />
                                                )}
                                                {policy.hasAccess ? "available" : "locked"}
                                            </Badge>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-[var(--muted)]">
                                    No reusable access conditions have been published yet.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-[28px]">
                        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle>Posts by {authorQuery.data.displayName}</CardTitle>
                            </div>
                            <Button className="rounded-full" disabled variant="outline">
                                Projects coming soon
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {postsQuery.isLoading ? (
                                <p className="text-sm text-[var(--muted)]">Loading posts...</p>
                            ) : postsQuery.isError ? (
                                <p className="text-sm text-rose-600">{postsQuery.error.message}</p>
                            ) : (
                                <PostFeed emptyLabel="No posts yet." posts={postsQuery.data} />
                            )}
                        </CardContent>
                    </Card>
                </>
            ) : null}
        </section>
    )
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(value))
}

function formatPlanPrice(
    chainId: number,
    tokenAddress: string,
    price: string,
    paymentAsset: "erc20" | "native"
) {
    const token = getTokenPresets(chainId).find((preset) =>
        paymentAsset === "native"
            ? preset.kind === "native"
            : preset.address?.toLowerCase() === tokenAddress.toLowerCase()
    )
    const decimals = token?.decimals ?? 18
    const symbol = token?.symbol ?? "tokens"

    try {
        return `${formatUnits(BigInt(price), decimals)} ${symbol}`
    } catch {
        return `${price} ${symbol}`
    }
}
