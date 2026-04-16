import { HomeHero } from "@/components/home-page/HomeHero"
import { WorkspaceMetrics } from "@/components/home-page/WorkspaceMetrics"
import { useMyPostsQuery } from "@/queries/posts"
import { useMeQuery, useMyAuthorProfileQuery } from "@/queries/profile"
import { useMyProjectsQuery } from "@/queries/projects"
import { useAuthStore } from "@/stores/auth-store"
import { useWorkspaceStore } from "@/stores/workspace-store"

export function HomePage() {
    const token = useAuthStore((state) => state.token)
    const setMode = useWorkspaceStore((state) => state.setMode)
    const meQuery = useMeQuery(Boolean(token))
    const authorQuery = useMyAuthorProfileQuery(Boolean(token))
    const postsQuery = useMyPostsQuery(Boolean(token))
    const projectsQuery = useMyProjectsQuery(Boolean(token))

    return (
        <div className="grid gap-6">
            <HomeHero
                authorSlug={authorQuery.data?.slug}
                onOpenAuthorWorkspace={() => setMode("author")}
            />
            <WorkspaceMetrics
                metrics={[
                    { label: "Wallet session", value: token ? "Signed in" : "Not signed in" },
                    { label: "Profile", value: meQuery.data?.displayName ?? "No profile" },
                    { label: "Posts", value: String(postsQuery.data?.length ?? 0) },
                    { label: "Projects", value: String(projectsQuery.data?.length ?? 0) },
                ]}
            />
        </div>
    )
}
