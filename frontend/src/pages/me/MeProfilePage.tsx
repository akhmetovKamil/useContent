import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eyebrow, PageSection, PageTitle } from "@/components/ui/page"
import { useMeQuery, useMyReaderSubscriptionsQuery } from "@/queries/profile"
import { useAuthStore } from "@/stores/auth-store"

export function MeProfilePage() {
    const token = useAuthStore((state) => state.token)
    const meQuery = useMeQuery(Boolean(token))
    const subscriptionsQuery = useMyReaderSubscriptionsQuery(Boolean(token))
    const subscriptionCount = subscriptionsQuery.data?.length ?? 0

    return (
        <section className="grid gap-6">
            <PageSection>
                <Eyebrow>profile</Eyebrow>
                <PageTitle>Your reader identity and subscriptions.</PageTitle>
                <p className="mt-4 max-w-2xl text-[var(--muted)]">
                    Keep track of your account, connected wallet, profile settings, and paid access
                    from one place.
                </p>
            </PageSection>

            {!token ? (
                <Card>
                    <CardContent className="pt-5 text-[var(--muted)]">
                        Connect a wallet to open your profile.
                    </CardContent>
                </Card>
            ) : meQuery.isLoading ? (
                <Card>
                    <CardContent className="pt-5 text-[var(--muted)]">
                        Loading profile...
                    </CardContent>
                </Card>
            ) : meQuery.data ? (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="rounded-[28px]">
                        <CardHeader>
                            <Eyebrow className="tracking-[0.3em]">user</Eyebrow>
                            <CardTitle>{meQuery.data.displayName}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-[var(--muted)]">
                                @{meQuery.data.username ?? "username not set"}
                            </div>
                            <p className="mt-4 text-sm text-[var(--muted)]">
                                {meQuery.data.bio || "Bio is empty"}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[28px]">
                        <CardHeader>
                            <Eyebrow className="tracking-[0.3em]">wallet</Eyebrow>
                            <CardTitle className="break-all font-mono text-sm">
                                {meQuery.data.primaryWallet}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-[var(--muted)]">
                                Connected wallets: {meQuery.data.wallets.length}
                            </p>
                            <p className="mt-2 text-sm text-[var(--muted)]">
                                Role: {meQuery.data.role}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[28px]">
                        <CardHeader>
                            <Eyebrow className="tracking-[0.3em]">subscriptions</Eyebrow>
                            <CardTitle className="text-3xl">{subscriptionCount}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-[var(--muted)]">
                                Active or historical subscriptions attached to this wallet.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[28px]">
                        <CardHeader>
                            <Eyebrow className="tracking-[0.3em]">settings</Eyebrow>
                            <CardTitle>Profile data</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-[var(--muted)]">
                                Edit username, display name, bio, and workspace colors.
                            </p>
                            <Button asChild className="mt-5 rounded-full" variant="outline">
                                <Link to="/me/settings">Open settings</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            ) : null}
        </section>
    )
}
