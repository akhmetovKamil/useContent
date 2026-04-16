import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { PageSection, PageTitle } from "@/components/ui/page"

interface HomeHeroProps {
    authorSlug?: string
    isSignedIn: boolean
}

export function HomeHero({ authorSlug, isSignedIn }: HomeHeroProps) {
    return (
        <PageSection className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <div>
                <PageTitle className="max-w-3xl md:text-6xl">
                    Content, access rules, and subscriptions in one place.
                </PageTitle>
                <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
                    Create an author profile, configure a subscription plan, publish posts and
                    project spaces, then test private reading from public author pages.
                </p>
            </div>

            <div className="grid gap-3 self-end">
                {isSignedIn ? (
                    <>
                        <ActionLink
                            label="Open profile"
                            to={authorSlug ? `/authors/${authorSlug}` : "/me/profile"}
                        />
                        <ActionLink label="Open settings" to="/me/settings" />
                        <ActionLink label="My subscriptions" to="/me/subscriptions" />
                    </>
                ) : (
                    <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5 text-sm leading-6 text-[var(--muted)]">
                        Connect a wallet and sign the nonce to unlock user pages and author mode.
                    </div>
                )}
            </div>
        </PageSection>
    )
}

function ActionLink({ label, to }: { label: string; to: string }) {
    return (
        <Button asChild className="justify-start rounded-full" variant="outline">
            <Link to={to}>{label}</Link>
        </Button>
    )
}
