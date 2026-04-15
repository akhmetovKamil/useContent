import { useEffect, useState } from "react"

import { isApiNotFoundError } from "@/lib/api/errors"
import {
    useMySubscriptionPlanQuery,
    useUpsertMySubscriptionPlanMutation,
} from "@/queries/subscription-plans"
import { useAuthStore } from "@/shared/session/auth-store"

export function MeSubscriptionPlanPage() {
    const token = useAuthStore((state) => state.token)
    const planQuery = useMySubscriptionPlanQuery(Boolean(token))
    const upsertPlanMutation = useUpsertMySubscriptionPlanMutation()
    const [title, setTitle] = useState("Main subscription")
    const [chainId, setChainId] = useState("11155111")
    const [tokenAddress, setTokenAddress] = useState("0x0000000000000000000000000000000000000000")
    const [price, setPrice] = useState("1000000")
    const [billingPeriodDays, setBillingPeriodDays] = useState("30")
    const [contractAddress, setContractAddress] = useState(
        "0x0000000000000000000000000000000000000000"
    )
    const [active, setActive] = useState(true)

    useEffect(() => {
        if (!planQuery.data) {
            return
        }

        setTitle(planQuery.data.title)
        setChainId(String(planQuery.data.chainId))
        setTokenAddress(planQuery.data.tokenAddress)
        setPrice(planQuery.data.price)
        setBillingPeriodDays(String(planQuery.data.billingPeriodDays))
        setContractAddress(planQuery.data.contractAddress)
        setActive(planQuery.data.active)
    }, [planQuery.data])

    return (
        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-6 md:p-8">
            <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                Monetization
            </div>
            <h2 className="mt-3 font-[var(--serif)] text-3xl text-[var(--foreground)]">
                Main author subscription plan
            </h2>
            {!token ? (
                <p className="mt-3 text-[var(--muted)]">
                    После авторизации тут будет форма для главного subscription plan автора.
                </p>
            ) : (
                <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <form
                        className="grid gap-4 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5"
                        onSubmit={(event) => {
                            event.preventDefault()
                            void upsertPlanMutation.mutateAsync({
                                title,
                                chainId: Number(chainId),
                                tokenAddress,
                                price,
                                billingPeriodDays: Number(billingPeriodDays),
                                contractAddress,
                                active,
                            })
                        }}
                    >
                        <div>
                            <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                                subscription plan
                            </div>
                            <p className="mt-2 text-sm text-[var(--muted)]">
                                Один основной план автора. Позже поверх этого спокойно нарастим
                                гибкие policy-комбинации.
                            </p>
                        </div>

                        <label className="grid gap-2 text-sm text-[var(--foreground)]">
                            Title
                            <input
                                className="rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none"
                                onChange={(event) => setTitle(event.target.value)}
                                value={title}
                            />
                        </label>

                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="grid gap-2 text-sm text-[var(--foreground)]">
                                Chain ID
                                <input
                                    className="rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none"
                                    onChange={(event) => setChainId(event.target.value)}
                                    value={chainId}
                                />
                            </label>

                            <label className="grid gap-2 text-sm text-[var(--foreground)]">
                                Billing period days
                                <input
                                    className="rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none"
                                    onChange={(event) => setBillingPeriodDays(event.target.value)}
                                    value={billingPeriodDays}
                                />
                            </label>
                        </div>

                        <label className="grid gap-2 text-sm text-[var(--foreground)]">
                            Token address
                            <input
                                className="rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 font-mono text-sm outline-none"
                                onChange={(event) => setTokenAddress(event.target.value)}
                                value={tokenAddress}
                            />
                        </label>

                        <label className="grid gap-2 text-sm text-[var(--foreground)]">
                            Price
                            <input
                                className="rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none"
                                onChange={(event) => setPrice(event.target.value)}
                                value={price}
                            />
                        </label>

                        <label className="grid gap-2 text-sm text-[var(--foreground)]">
                            Contract address
                            <input
                                className="rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 font-mono text-sm outline-none"
                                onChange={(event) => setContractAddress(event.target.value)}
                                value={contractAddress}
                            />
                        </label>

                        <label className="flex items-center gap-3 text-sm text-[var(--foreground)]">
                            <input
                                checked={active}
                                onChange={(event) => setActive(event.target.checked)}
                                type="checkbox"
                            />
                            Plan is active
                        </label>

                        {upsertPlanMutation.isError ? (
                            <p className="text-sm text-rose-600">
                                {upsertPlanMutation.error.message}
                            </p>
                        ) : null}

                        <button
                            className="w-fit rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-60"
                            disabled={upsertPlanMutation.isPending}
                            type="submit"
                        >
                            {upsertPlanMutation.isPending ? "Saving..." : "Save plan"}
                        </button>
                    </form>

                    <div className="grid gap-4">
                        {planQuery.isLoading ? (
                            <p className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5 text-[var(--muted)]">
                                Загружаем текущий план...
                            </p>
                        ) : null}

                        {planQuery.isError && !isApiNotFoundError(planQuery.error) ? (
                            <p className="rounded-[24px] border border-rose-200 bg-rose-50 p-5 text-rose-600">
                                Не удалось загрузить план: {planQuery.error.message}
                            </p>
                        ) : null}

                        {planQuery.data ? (
                            <article className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
                                <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                                    current plan
                                </div>
                                <div className="mt-3 text-2xl text-[var(--foreground)]">
                                    {planQuery.data.title}
                                </div>
                                <div className="mt-2 text-sm text-[var(--muted)]">
                                    {planQuery.data.price} units every{" "}
                                    {planQuery.data.billingPeriodDays} days
                                </div>
                                <div className="mt-4 font-mono text-xs leading-6 text-[var(--muted)]">
                                    token: {planQuery.data.tokenAddress}
                                    <br />
                                    contract: {planQuery.data.contractAddress}
                                </div>
                            </article>
                        ) : !planQuery.isLoading ? (
                            <p className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5 text-[var(--muted)]">
                                План еще не создан. Форму слева уже можно использовать для первого
                                сохранения.
                            </p>
                        ) : null}
                    </div>
                </div>
            )}
        </section>
    )
}
