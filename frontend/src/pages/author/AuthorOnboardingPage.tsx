import { useNavigate } from "react-router-dom"

import { AuthorProfileForm } from "@/components/author-onboarding/AuthorProfileForm"
import { AuthorValuePanel } from "@/components/author-onboarding/AuthorValuePanel"
import { useCreateMyAuthorProfileMutation } from "@/queries/profile"
import { useWorkspaceStore } from "@/stores/workspace-store"

export function AuthorOnboardingPage() {
    const navigate = useNavigate()
    const setMode = useWorkspaceStore((state) => state.setMode)
    const createAuthorMutation = useCreateMyAuthorProfileMutation()

    return (
        <section className="grid gap-6 xl:h-[calc(100vh-13.5rem)] xl:min-h-[620px] xl:grid-cols-[1.05fr_0.95fr]">
            <div className="min-h-0 xl:order-2">
                <AuthorProfileForm
                    className="min-h-0"
                    error={createAuthorMutation.error?.message ?? null}
                    isPending={createAuthorMutation.isPending}
                    mode="create"
                    onSubmit={(input) => {
                        void createAuthorMutation.mutateAsync(input).then(() => {
                            setMode("author")
                            navigate("/author")
                        })
                    }}
                />
            </div>
            <div className="min-h-0 xl:order-1">
                <AuthorValuePanel />
            </div>
        </section>
    )
}
