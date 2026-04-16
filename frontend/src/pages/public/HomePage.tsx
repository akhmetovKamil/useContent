import { HomeHero } from "@/components/home-page/HomeHero"
import { useMyAuthorProfileQuery } from "@/queries/profile"
import { useAuthStore } from "@/stores/auth-store"

export function HomePage() {
    const token = useAuthStore((state) => state.token)
    const authorQuery = useMyAuthorProfileQuery(Boolean(token))

    return (
        <div className="grid gap-6">
            <HomeHero authorSlug={authorQuery.data?.slug} isSignedIn={Boolean(token)} />
        </div>
    )
}
