import { Link, useParams } from "react-router-dom"
import { formatUnits } from "viem"

import { SubscribeButton } from "@/components/subscriptions/SubscribeButton"
import { useAuthorProfileQuery } from "@/queries/authors"
import { useAuthorPostsQuery } from "@/queries/posts"
import { useAuthorProjectsQuery } from "@/queries/projects"
import { useAuthorSubscriptionPlansQuery } from "@/queries/subscription-plans"
import { getTokenPresets } from "@/utils/config/tokens"

export function AuthorPage() {
    const { slug } = useParams()
    const authorSlug = slug ?? ""
    const authorQuery = useAuthorProfileQuery(authorSlug)
    const postsQuery = useAuthorPostsQuery(authorSlug)
    const projectsQuery = useAuthorProjectsQuery(authorSlug)
    const plansQuery = useAuthorSubscriptionPlansQuery(authorSlug)

    return (
        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-6 md:p-8">
            <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                Author page
            </div>
            <h2 className="mt-3 font-[var(--serif)] text-3xl text-[var(--foreground)]">@{slug}</h2>

            {authorQuery.isLoading ? (
                <p className="mt-3 max-w-2xl text-[var(--muted)]">Загружаем публичный профиль...</p>
            ) : authorQuery.isError ? (
                <p className="mt-3 max-w-2xl text-rose-600">
                    Профиль автора не найден: {authorQuery.error.message}
                </p>
            ) : authorQuery.data ? (
                <>
                    <p className="mt-3 max-w-2xl text-[var(--muted)]">
                        {authorQuery.data.bio || "Автор пока не добавил описание профиля."}
                    </p>

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        <article className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
                            <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                                author
                            </div>
                            <div className="mt-3 text-xl text-[var(--foreground)]">
                                {authorQuery.data.displayName}
                            </div>
                            <div className="mt-2 text-sm text-[var(--muted)]">
                                slug: @{authorQuery.data.slug}
                            </div>
                        </article>

                        <article className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
                            <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                                content
                            </div>
                            <div className="mt-3 text-sm text-[var(--muted)]">
                                Posts: {postsQuery.data?.length ?? 0}
                            </div>
                            <div className="mt-2 text-sm text-[var(--muted)]">
                                Projects: {projectsQuery.data?.length ?? 0}
                            </div>
                        </article>

                        <article className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
                            <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                                subscription
                            </div>
                            <div className="mt-3 text-sm text-[var(--foreground)]">
                                {plansQuery.data?.length
                                    ? `${plansQuery.data.length} active plan(s)`
                                    : "No active plan yet"}
                            </div>
                        </article>
                    </div>

                    {plansQuery.data?.length ? (
                        <div className="mt-6 grid gap-3 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
                            <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                                subscribe
                            </div>
                            {plansQuery.data.map((plan) => (
                                <article
                                    className="grid gap-3 rounded-[20px] border border-[var(--line)] bg-[var(--surface-strong)] p-4"
                                    key={plan.id}
                                >
                                    <div>
                                        <div className="text-lg text-[var(--foreground)]">
                                            {plan.title}
                                        </div>
                                        <div className="mt-1 text-sm text-[var(--muted)]">
                                            {formatPlanPrice(
                                                plan.chainId,
                                                plan.tokenAddress,
                                                plan.price,
                                                plan.paymentAsset ?? "erc20"
                                            )}{" "}
                                            every {plan.billingPeriodDays} days
                                        </div>
                                        <div className="mt-2 break-all font-mono text-xs text-[var(--muted)]">
                                            {plan.planKey}
                                        </div>
                                    </div>
                                    <SubscribeButton authorSlug={authorSlug} plan={plan} />
                                </article>
                            ))}
                        </div>
                    ) : null}

                    <div className="mt-8 grid gap-6 lg:grid-cols-2">
                        <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
                            <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                                published posts
                            </div>
                            <div className="mt-4 grid gap-3">
                                {postsQuery.data?.length ? (
                                    postsQuery.data.map((post) => (
                                        <article
                                            className="rounded-[20px] border border-[var(--line)] bg-[var(--surface-strong)] p-4"
                                            key={post.id}
                                        >
                                            <Link
                                                className="text-lg text-[var(--foreground)] underline-offset-4 hover:underline"
                                                to={`/authors/${authorSlug}/posts/${post.id}`}
                                            >
                                                {post.title}
                                            </Link>
                                            <div className="mt-2 text-sm text-[var(--muted)]">
                                                {post.content.slice(0, 180)}
                                            </div>
                                        </article>
                                    ))
                                ) : (
                                    <p className="text-sm text-[var(--muted)]">Постов пока нет.</p>
                                )}
                            </div>
                        </div>

                        <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
                            <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                                published projects
                            </div>
                            <div className="mt-4 grid gap-3">
                                {projectsQuery.data?.length ? (
                                    projectsQuery.data.map((project) => (
                                        <article
                                            className="rounded-[20px] border border-[var(--line)] bg-[var(--surface-strong)] p-4"
                                            key={project.id}
                                        >
                                            <Link
                                                className="text-lg text-[var(--foreground)] underline-offset-4 hover:underline"
                                                to={`/authors/${authorSlug}/projects/${project.id}`}
                                            >
                                                {project.title}
                                            </Link>
                                            <div className="mt-2 text-sm text-[var(--muted)]">
                                                {project.description || "No description yet"}
                                            </div>
                                        </article>
                                    ))
                                ) : (
                                    <p className="text-sm text-[var(--muted)]">
                                        Опубликованных проектов пока нет.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            ) : null}
        </section>
    )
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
