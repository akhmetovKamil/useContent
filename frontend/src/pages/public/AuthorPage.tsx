import type { AccessPolicyConditionDto, AuthorAccessPolicyDto } from "@contracts/types/content"
import {
    CheckCircle2,
    ExternalLink,
    Gem,
    LockKeyhole,
    ShieldCheck,
    TicketCheck,
    UsersRound,
    WalletCards,
} from "lucide-react"
import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { formatUnits } from "viem"

import { PostFeed } from "@/components/posts/PostFeed"
import { ProjectList } from "@/components/projects/ProjectList"
import { SubscribeButton } from "@/components/subscriptions/SubscribeButton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import { useAuthorAccessPoliciesQuery, useAuthorProfileQuery } from "@/queries/authors"
import { useAuthorPostsQuery } from "@/queries/posts"
import { useAuthorProjectsQuery } from "@/queries/projects"
import { getTokenPresets } from "@/utils/config/tokens"

export function AuthorPage() {
    const { slug } = useParams()
    const authorSlug = slug ?? ""
    const authorQuery = useAuthorProfileQuery(authorSlug)
    const postsQuery = useAuthorPostsQuery(authorSlug)
    const projectsQuery = useAuthorProjectsQuery(authorSlug)
    const policiesQuery = useAuthorAccessPoliciesQuery(authorSlug)
    const [selectedTierId, setSelectedTierId] = useState<string | null>(null)
    const selectedTier = policiesQuery.data?.find((policy) => policy.id === selectedTierId) ?? null

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

                    <Card className="overflow-hidden rounded-[32px]">
                        <CardHeader>
                            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                                <ShieldCheck className="size-4" />
                                access tiers
                            </div>
                            <CardTitle>Choose what you want to unlock</CardTitle>
                            <CardDescription>
                                Tiers combine subscriptions, token ownership, and NFT ownership.
                                Public content stays available without a wallet.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="bg-[linear-gradient(135deg,var(--surface)_0%,var(--surface-strong)_100%)]">
                            {policiesQuery.isLoading ? (
                                <p className="text-sm text-[var(--muted)]">Loading tiers...</p>
                            ) : (
                                <div className="grid gap-4 lg:grid-cols-3">
                                    <PublicTierCard />
                                    {policiesQuery.data?.map((policy) => (
                                        <TierCard
                                            key={policy.id}
                                            onOpen={() => setSelectedTierId(policy.id)}
                                            policy={policy}
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-[28px]">
                        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle>Posts by {authorQuery.data.displayName}</CardTitle>
                            </div>
                            <Button asChild className="rounded-full" variant="outline">
                                <Link to="#projects">Projects</Link>
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

                    <Card className="rounded-[28px]" id="projects">
                        <CardHeader>
                            <CardTitle>Projects by {authorQuery.data.displayName}</CardTitle>
                            <CardDescription>
                                Structured spaces published by this author.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {projectsQuery.isLoading ? (
                                <p className="text-sm text-[var(--muted)]">Loading projects...</p>
                            ) : projectsQuery.isError ? (
                                <p className="text-sm text-rose-600">
                                    {projectsQuery.error.message}
                                </p>
                            ) : (
                                <ProjectList
                                    emptyLabel="No projects yet."
                                    projects={projectsQuery.data}
                                />
                            )}
                        </CardContent>
                    </Card>

                    <TierDrawer
                        authorSlug={authorSlug}
                        onOpenChange={(open) => {
                            if (!open) {
                                setSelectedTierId(null)
                            }
                        }}
                        open={Boolean(selectedTier)}
                        tier={selectedTier}
                    />
                </>
            ) : null}
        </section>
    )
}

function PublicTierCard() {
    return (
        <article className="grid min-h-[230px] gap-4 rounded-[30px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="mb-4 grid size-11 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                        <TicketCheck className="size-5" />
                    </div>
                    <h3 className="font-[var(--serif)] text-2xl text-[var(--foreground)]">
                        Public
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        Free posts and projects that do not require wallet ownership checks.
                    </p>
                </div>
                <Badge variant="success">open</Badge>
            </div>
            <Button asChild className="w-fit rounded-full" variant="outline">
                <Link to="#projects">Browse public content</Link>
            </Button>
        </article>
    )
}

function TierCard({ onOpen, policy }: { onOpen: () => void; policy: AuthorAccessPolicyDto }) {
    return (
        <article className="grid min-h-[230px] gap-4 rounded-[30px] border border-[var(--line)] bg-[radial-gradient(circle_at_top_left,var(--accent-soft),transparent_42%),var(--surface)] p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow)]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="mb-4 grid size-11 place-items-center rounded-2xl bg-[var(--foreground)] text-[var(--background)]">
                        <ShieldCheck className="size-5" />
                    </div>
                    <h3 className="font-[var(--serif)] text-2xl text-[var(--foreground)]">
                        {policy.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        {policy.description || "Unlock this tier by meeting its conditions."}
                    </p>
                </div>
                <Badge variant={policy.hasAccess ? "success" : "warning"}>
                    {policy.hasAccess ? "unlocked" : "locked"}
                </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
                <Badge>{policy.conditionMode.toUpperCase()}</Badge>
                {policy.conditions.map((condition, index) => (
                    <Badge key={`${condition.type}-${index}`}>
                        {formatConditionChip(condition)}
                    </Badge>
                ))}
            </div>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                    <UsersRound className="size-4" />
                    {policy.paidSubscribersCount} paid members
                </div>
                <Button className="rounded-full" onClick={onOpen} type="button">
                    {policy.hasAccess ? "View tier" : "Unlock tier"}
                </Button>
            </div>
        </article>
    )
}

function TierDrawer({
    authorSlug,
    onOpenChange,
    open,
    tier,
}: {
    authorSlug: string
    onOpenChange: (open: boolean) => void
    open: boolean
    tier: AuthorAccessPolicyDto | null
}) {
    if (!tier) {
        return null
    }

    return (
        <Drawer onOpenChange={onOpenChange} open={open}>
            <DrawerContent
                className="mx-auto max-w-4xl md:right-6 md:bottom-6 md:left-6 md:max-h-[86vh] md:rounded-[36px]"
                onClose={() => onOpenChange(false)}
            >
                <DrawerHeader className="text-center">
                    <Badge className="w-fit" variant={tier.hasAccess ? "success" : "warning"}>
                        {tier.hasAccess ? "Unlocked" : "Locked"}
                    </Badge>
                    <DrawerTitle>{tier.name}</DrawerTitle>
                    <DrawerDescription>
                        {tier.description || "Meet every required condition to unlock this tier."}
                    </DrawerDescription>
                </DrawerHeader>

                <div className="mt-6 grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
                    <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-5">
                        <div className="text-sm font-medium text-[var(--foreground)]">
                            Policy logic
                        </div>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                            {describeConditionMode(tier.conditionMode)}
                        </p>
                        <div className="mt-5 flex items-center gap-2 text-sm text-[var(--muted)]">
                            <UsersRound className="size-4" />
                            {tier.paidSubscribersCount} paid members
                        </div>
                    </div>

                    <div className="grid gap-3">
                        {tier.conditions.map((condition, index) => (
                            <ConditionCard
                                authorSlug={authorSlug}
                                condition={condition}
                                key={`${condition.type}-${index}`}
                            />
                        ))}

                        {tier.hasAccess ? (
                            <Button asChild className="rounded-full">
                                <Link to="#projects">View unlocked content</Link>
                            </Button>
                        ) : null}
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}

function ConditionCard({
    authorSlug,
    condition,
}: {
    authorSlug: string
    condition: AccessPolicyConditionDto
}) {
    return (
        <article className="grid gap-4 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2 font-medium text-[var(--foreground)]">
                        <ConditionIcon condition={condition} />
                        {getConditionTitle(condition)}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        {getConditionDescription(condition)}
                    </p>
                </div>
                <Badge variant={condition.satisfied ? "success" : "warning"}>
                    {condition.satisfied ? "satisfied" : "missing"}
                </Badge>
            </div>

            {condition.type === "subscription" ? (
                <div className="grid gap-3">
                    {condition.validUntil ? (
                        <p className="text-sm text-[var(--muted)]">
                            Active until {formatDate(condition.validUntil)}
                        </p>
                    ) : null}
                    {!condition.satisfied ? (
                        <SubscribeButton
                            authorSlug={authorSlug}
                            label="Pay subscription"
                            plan={condition.plan}
                        />
                    ) : null}
                </div>
            ) : (
                <Button asChild className="w-fit rounded-full" size="sm" variant="outline">
                    <a
                        href={getExplorerAddressUrl(condition.chainId, condition.contractAddress)}
                        rel="noreferrer"
                        target="_blank"
                    >
                        View contract
                        <ExternalLink className="size-4" />
                    </a>
                </Button>
            )}
        </article>
    )
}

function ConditionIcon({ condition }: { condition: AccessPolicyConditionDto }) {
    if (condition.satisfied) {
        return <CheckCircle2 className="size-4 text-emerald-600" />
    }

    if (condition.type === "subscription") {
        return <WalletCards className="size-4 text-amber-600" />
    }

    if (condition.type === "nft_ownership") {
        return <Gem className="size-4 text-amber-600" />
    }

    return <LockKeyhole className="size-4 text-amber-600" />
}

function getConditionTitle(condition: AccessPolicyConditionDto) {
    switch (condition.type) {
        case "subscription":
            return condition.plan.title
        case "token_balance":
            return "Token balance"
        case "nft_ownership":
            return `${condition.standard.toUpperCase()} ownership`
        default:
            return "Condition"
    }
}

function getConditionDescription(condition: AccessPolicyConditionDto) {
    switch (condition.type) {
        case "subscription":
            return `${formatPlanPrice(
                condition.plan.chainId,
                condition.plan.tokenAddress,
                condition.plan.price,
                condition.plan.paymentAsset
            )} every ${condition.plan.billingPeriodDays} days.`
        case "token_balance":
            return `Requires ${formatTokenAmount(condition.minAmount, condition.decimals)} tokens on chain ${
                condition.chainId
            }. Current balance: ${
                condition.currentBalance
                    ? formatTokenAmount(condition.currentBalance, condition.decimals)
                    : "not detected"
            }.`
        case "nft_ownership":
            return `Requires ${condition.tokenId ? `token #${condition.tokenId}` : "collection ownership"} on chain ${
                condition.chainId
            }. Current balance: ${condition.currentBalance ?? "not detected"}.`
        default:
            return ""
    }
}

function describeConditionMode(mode: AuthorAccessPolicyDto["conditionMode"]) {
    if (mode === "and") {
        return "Every condition below must be satisfied."
    }
    if (mode === "or") {
        return "Any condition below can unlock this tier."
    }

    return "This tier uses one condition."
}

function formatConditionChip(condition: AccessPolicyConditionDto) {
    switch (condition.type) {
        case "subscription":
            return "Subscription"
        case "token_balance":
            return "Token"
        case "nft_ownership":
            return "NFT"
        default:
            return "Rule"
    }
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

function formatTokenAmount(value: string, decimals: number) {
    try {
        return formatUnits(BigInt(value), decimals)
    } catch {
        return value
    }
}

function getExplorerAddressUrl(chainId: number, address: string) {
    const baseUrl =
        {
            1: "https://etherscan.io",
            10: "https://optimistic.etherscan.io",
            42161: "https://arbiscan.io",
            8453: "https://basescan.org",
            11155111: "https://sepolia.etherscan.io",
            84532: "https://sepolia.basescan.org",
            11155420: "https://sepolia-optimism.etherscan.io",
            421614: "https://sepolia.arbiscan.io",
        }[chainId] ?? "https://etherscan.io"

    return `${baseUrl}/address/${address}`
}
