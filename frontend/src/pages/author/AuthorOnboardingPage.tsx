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
        <section className="grid min-h-[calc(100vh-15rem)] gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <AuthorValuePanel />
            <div className="flex items-center">
                <AuthorProfileForm
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
        </section>
    )
}
