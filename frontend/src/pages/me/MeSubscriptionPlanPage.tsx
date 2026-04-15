import { useMySubscriptionPlanQuery } from "@/queries/subscription-plans"
import { useAuthStore } from "@/shared/session/auth-store"

export function MeSubscriptionPlanPage() {
    const token = useAuthStore((state) => state.token)
    const planQuery = useMySubscriptionPlanQuery(Boolean(token))

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
            ) : planQuery.isLoading ? (
                <p className="mt-3 text-[var(--muted)]">Загружаем текущий план...</p>
            ) : planQuery.isError ? (
                <p className="mt-3 text-rose-600">
                    План пока не настроен или недоступен: {planQuery.error.message}
                </p>
            ) : planQuery.data ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <article className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
                        <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                            plan
                        </div>
                        <div className="mt-3 text-2xl text-[var(--foreground)]">
                            {planQuery.data.title}
                        </div>
                        <div className="mt-2 text-sm text-[var(--muted)]">
                            {planQuery.data.price} units every {planQuery.data.billingPeriodDays}{" "}
                            days
                        </div>
                    </article>

                    <article className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
                        <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                            contract
                        </div>
                        <div className="mt-3 font-mono text-sm text-[var(--foreground)]">
                            {planQuery.data.contractAddress}
                        </div>
                        <div className="mt-2 text-sm text-[var(--muted)]">
                            chainId: {planQuery.data.chainId}, token: {planQuery.data.tokenAddress}
                        </div>
                    </article>
                </div>
            ) : null}
        </section>
    )
}
