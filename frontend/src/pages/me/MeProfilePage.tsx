import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eyebrow, PageSection, PageTitle } from "@/components/ui/page"
import { useMeQuery, useMyAuthorProfileQuery, useMyEntitlementsQuery } from "@/queries/profile"
import { useAuthStore } from "@/stores/auth-store"

export function MeProfilePage() {
    const token = useAuthStore((state) => state.token)
    const meQuery = useMeQuery(Boolean(token))
    const authorQuery = useMyAuthorProfileQuery(Boolean(token))
    const entitlementsQuery = useMyEntitlementsQuery(Boolean(token))

    return (
        <section className="grid gap-6">
            <PageSection>
                <Eyebrow>profile</Eyebrow>
                <PageTitle>Your wallet identity and public presence.</PageTitle>
                <p className="mt-4 max-w-2xl text-[var(--muted)]">
                    Keep track of your account, wallet session, author page, and current access
                    grants from one place.
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
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="rounded-[28px]">
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
                            <Button asChild className="mt-5 rounded-full" variant="outline">
                                <Link to="/me/settings">Edit settings</Link>
                            </Button>
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
                            <div className="text-sm text-[var(--muted)]">
                                Connected wallets: {meQuery.data.wallets.length}
                            </div>
                            <div className="mt-2 text-sm text-[var(--muted)]">
                                Role: {meQuery.data.role}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[28px]">
                        <CardHeader>
                            <Eyebrow className="tracking-[0.3em]">access</Eyebrow>
                            <CardTitle className="text-3xl">
                                {entitlementsQuery.data?.length ?? 0}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-[var(--muted)]">
                                Active or historical subscription grants attached to this wallet.
                            </div>
                            <Button asChild className="mt-5 rounded-full" variant="outline">
                                <Link to="/me/subscriptions">My subscriptions</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {authorQuery.data ? (
                        <Card className="rounded-[28px] md:col-span-3">
                            <CardHeader>
                                <Eyebrow className="tracking-[0.3em]">public author page</Eyebrow>
                                <CardTitle>@{authorQuery.data.slug}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-wrap items-center justify-between gap-4">
                                <p className="max-w-2xl text-sm text-[var(--muted)]">
                                    {authorQuery.data.bio ||
                                        "This author page is ready for posts, projects, and subscription plans."}
                                </p>
                                <Button asChild className="rounded-full">
                                    <Link to={`/authors/${authorQuery.data.slug}`}>
                                        Open public profile
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : null}
                </div>
            ) : null}
        </section>
    )
}
