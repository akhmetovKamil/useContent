import { useMeQuery, useMyEntitlementsQuery } from "@/queries/profile"
import { useAuthStore } from "@/shared/session/auth-store"

export function MePage() {
    const token = useAuthStore((state) => state.token)
    const meQuery = useMeQuery(Boolean(token))
    const entitlementsQuery = useMyEntitlementsQuery(Boolean(token))

    return (
        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-6 md:p-8">
            <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                Personal cabinet
            </div>
            <h2 className="mt-3 font-[var(--serif)] text-3xl text-[var(--foreground)]">
                Wallet, profile, and private dashboard
            </h2>
            {!token ? (
                <p className="mt-3 max-w-2xl text-[var(--muted)]">
                    Подключи кошелек и подпиши сообщение в правом верхнем блоке, чтобы увидеть
                    личный кабинет и активные доступы.
                </p>
            ) : meQuery.isLoading ? (
                <p className="mt-3 max-w-2xl text-[var(--muted)]">Загружаем профиль...</p>
            ) : meQuery.isError ? (
                <p className="mt-3 max-w-2xl text-rose-600">
                    Не удалось загрузить профиль: {meQuery.error.message}
                </p>
            ) : meQuery.data ? (
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <article className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
                        <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                            profile
                        </div>
                        <div className="mt-3 text-xl text-[var(--foreground)]">
                            {meQuery.data.displayName}
                        </div>
                        <div className="mt-2 text-sm text-[var(--muted)]">
                            @{meQuery.data.username ?? "username not set"}
                        </div>
                        <div className="mt-4 text-sm text-[var(--muted)]">{meQuery.data.bio}</div>
                    </article>

                    <article className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
                        <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                            wallet
                        </div>
                        <div className="mt-3 font-mono text-sm text-[var(--foreground)]">
                            {meQuery.data.primaryWallet}
                        </div>
                        <div className="mt-4 text-sm text-[var(--muted)]">
                            Connected wallets: {meQuery.data.wallets.length}
                        </div>
                        <div className="mt-2 text-sm text-[var(--muted)]">
                            Role: {meQuery.data.role}
                        </div>
                    </article>

                    <article className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
                        <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                            entitlements
                        </div>
                        <div className="mt-3 text-3xl text-[var(--foreground)]">
                            {entitlementsQuery.data?.length ?? 0}
                        </div>
                        <div className="mt-2 text-sm text-[var(--muted)]">
                            Active or historical subscription grants attached to this wallet.
                        </div>
                    </article>
                </div>
            ) : null}
        </section>
    )
}
