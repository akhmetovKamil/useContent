import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Eyebrow, PageSection, PageTitle } from "@/components/ui/page"

interface HomeHeroProps {
    authorSlug?: string
    onOpenAuthorWorkspace: () => void
}

export function HomeHero({ authorSlug, onOpenAuthorWorkspace }: HomeHeroProps) {
    return (
        <PageSection className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <div>
                <Eyebrow>workspace</Eyebrow>
                <PageTitle className="max-w-3xl md:text-6xl">
                    Content, access rules, and subscriptions in one place.
                </PageTitle>
                <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
                    Create an author profile, configure a subscription plan, publish posts and
                    project spaces, then test gated reading from public author pages.
                </p>
            </div>

            <div className="grid gap-3 self-end">
                <ActionLink label="Open profile" to="/me" />
                <ActionLink
                    label={authorSlug ? "Open author workspace" : "Become an author"}
                    onClick={onOpenAuthorWorkspace}
                    to="/author"
                />
                {authorSlug ? (
                    <ActionLink label="View public page" to={`/authors/${authorSlug}`} />
                ) : null}
            </div>
        </PageSection>
    )
}

function ActionLink({ label, onClick, to }: { label: string; onClick?: () => void; to: string }) {
    return (
        <Button asChild className="justify-start rounded-full" variant="outline">
            <Link onClick={onClick} to={to}>
                {label}
            </Link>
        </Button>
    )
}
