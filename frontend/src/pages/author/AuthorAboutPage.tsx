import { Link } from "react-router-dom"

import { AuthorValuePanel } from "@/components/author-onboarding/AuthorValuePanel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eyebrow, PageSection, PageTitle } from "@/components/ui/page"

export function AuthorAboutPage() {
    return (
        <section className="grid gap-6">
            <PageSection>
                <Eyebrow>about author mode</Eyebrow>
                <PageTitle>Creator tools for gated posts, projects, and subscriptions.</PageTitle>
                <p className="mt-4 max-w-3xl text-[var(--muted)]">
                    Author mode is the publishing side of useContent. It is designed for creators
                    who want a wallet-native identity, flexible access policies, and direct
                    crypto-native subscriptions without a platform-managed wallet.
                </p>
            </PageSection>

            <AuthorValuePanel />

            <Card className="rounded-[28px]">
                <CardHeader>
                    <CardTitle>Ready to publish?</CardTitle>
                    <CardDescription>
                        Create an author profile first. After that, the workspace unlocks posts,
                        projects, access policies, and subscription plan management.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="rounded-full">
                        <Link to="/author/onboarding">Open author onboarding</Link>
                    </Button>
                </CardContent>
            </Card>
        </section>
    )
}
