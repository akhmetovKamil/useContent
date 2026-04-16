import { useEffect, useState } from "react"

import { AppearancePicker } from "@/components/settings/AppearancePicker"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eyebrow, PageSection } from "@/components/ui/page"
import { Textarea } from "@/components/ui/textarea"
import { useMeQuery, useMyEntitlementsQuery, useUpdateMeMutation } from "@/queries/profile"
import { useAuthStore } from "@/stores/auth-store"

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
        <PageSection>
            <Eyebrow>Personal cabinet</Eyebrow>
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
                    <AppearancePicker />

                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <Eyebrow className="tracking-[0.3em]">profile</Eyebrow>
                                <CardTitle>{meQuery.data.displayName}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-[var(--muted)]">
                                    @{meQuery.data.username ?? "username not set"}
                                </div>
                                <div className="mt-4 text-sm text-[var(--muted)]">
                                    {meQuery.data.bio || "Bio is empty"}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Eyebrow className="tracking-[0.3em]">wallet</Eyebrow>
                                <CardTitle className="break-all font-mono text-sm">
                                    {meQuery.data.primaryWallet}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-[var(--muted)]">
                                    Connected wallets: {meQuery.data.wallets.length}
                                </div>
                                <div className="mt-2 text-sm text-[var(--muted)]">
                                    Role: {meQuery.data.role}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Eyebrow className="tracking-[0.3em]">entitlements</Eyebrow>
                                <CardTitle className="text-3xl">
                                    {entitlementsQuery.data?.length ?? 0}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-[var(--muted)]">
                                    Active or historical subscription grants attached to this
                                    wallet.
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <form
                        className="grid gap-4 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5"
                        onSubmit={(event) => {
                            event.preventDefault()
                            void updateMeMutation.mutateAsync({
                                username: username || null,
                                displayName,
                                bio,
                            })
                        }}
                    >
                        <Eyebrow className="tracking-[0.3em]">edit profile</Eyebrow>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Label>
                                Username
                                <Input
                                    onChange={(event) => setUsername(event.target.value)}
                                    value={username}
                                />
                            </Label>
                            <Label>
                                Display name
                                <Input
                                    onChange={(event) => setDisplayName(event.target.value)}
                                    value={displayName}
                                />
                            </Label>
                        </div>
                        <Label>
                            Bio
                            <Textarea
                                onChange={(event) => setBio(event.target.value)}
                                value={bio}
                            />
                        </Label>
                        {updateMeMutation.isError ? (
                            <p className="text-sm text-rose-600">
                                {updateMeMutation.error.message}
                            </p>
                        ) : null}
                        <Button
                            className="w-fit rounded-full"
                            disabled={updateMeMutation.isPending}
                            type="submit"
                        >
                            {updateMeMutation.isPending ? "Saving..." : "Save profile"}
                        </Button>
                    </form>
                </div>
            ) : null}
        </PageSection>
    )
}
