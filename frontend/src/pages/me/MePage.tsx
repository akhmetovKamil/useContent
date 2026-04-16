import { useEffect, useState } from "react"

import { useMeQuery, useMyEntitlementsQuery, useUpdateMeMutation } from "@/queries/profile"
import { useAuthStore } from "@/shared/session/auth-store"

export function MePage() {
    const token = useAuthStore((state) => state.token)
    const meQuery = useMeQuery(Boolean(token))
    const entitlementsQuery = useMyEntitlementsQuery(Boolean(token))
    const updateMeMutation = useUpdateMeMutation()
    const [username, setUsername] = useState("")
    const [displayName, setDisplayName] = useState("")
    const [bio, setBio] = useState("")

    useEffect(() => {
        if (!meQuery.data) {
            return
        }

        setUsername(meQuery.data.username ?? "")
        setDisplayName(meQuery.data.displayName)
        setBio(meQuery.data.bio)
    }, [meQuery.data])

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
                <div className="mt-6 grid gap-6">
                    <div className="grid gap-4 md:grid-cols-3">
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
                            <div className="mt-4 text-sm text-[var(--muted)]">
                                {meQuery.data.bio || "Bio is empty"}
                            </div>
                        </article>

                        <article className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
                            <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                                wallet
                            </div>
                            <div className="mt-3 break-all font-mono text-sm text-[var(--foreground)]">
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

                    <form
                        className="grid gap-4 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5"
                        onSubmit={(event) => {
                            event.preventDefault()
                            void updateMeMutation.mutateAsync({
                                username: username || null,
                                displayName,
                                bio,
                            })
                        }}
                    >
                        <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                            edit profile
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="grid gap-2 text-sm text-[var(--foreground)]">
                                Username
                                <input
                                    className="rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none"
                                    onChange={(event) => setUsername(event.target.value)}
                                    value={username}
                                />
                            </label>
                            <label className="grid gap-2 text-sm text-[var(--foreground)]">
                                Display name
                                <input
                                    className="rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none"
                                    onChange={(event) => setDisplayName(event.target.value)}
                                    value={displayName}
                                />
                            </label>
                        </div>
                        <label className="grid gap-2 text-sm text-[var(--foreground)]">
                            Bio
                            <textarea
                                className="min-h-28 rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none"
                                onChange={(event) => setBio(event.target.value)}
                                value={bio}
                            />
                        </label>
                        {updateMeMutation.isError ? (
                            <p className="text-sm text-rose-600">
                                {updateMeMutation.error.message}
                            </p>
                        ) : null}
                        <button
                            className="w-fit rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-60"
                            disabled={updateMeMutation.isPending}
                            type="submit"
                        >
                            {updateMeMutation.isPending ? "Saving..." : "Save profile"}
                        </button>
                    </form>
                </div>
            ) : null}
        </section>
    )
}
