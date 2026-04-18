import { useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"

import { AuthorProfileForm } from "@/components/author-onboarding/AuthorProfileForm"
import { AppearancePicker } from "@/components/settings/AppearancePicker"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { Eyebrow, PageSection, PageTitle } from "@/components/ui/page"
import {
    useDeleteMyAuthorProfileMutation,
    useMyAuthorProfileQuery,
    useUpdateMyAuthorProfileMutation,
} from "@/queries/profile"
import { useAuthStore } from "@/stores/auth-store"
import { useWorkspaceStore } from "@/stores/workspace-store"

export function MeAuthorPage() {
    const navigate = useNavigate()
    const token = useAuthStore((state) => state.token)
    const setMode = useWorkspaceStore((state) => state.setMode)
    const authorQuery = useMyAuthorProfileQuery(Boolean(token))
    const updateAuthorMutation = useUpdateMyAuthorProfileMutation()
    const deleteAuthorMutation = useDeleteMyAuthorProfileMutation()
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)

    if (!token) {
        return <Navigate replace to="/" />
    }

    if (authorQuery.isSuccess && !authorQuery.data) {
        return <Navigate replace to="/author/onboarding" />
    }

    return (
        <section className="grid gap-6">
            <PageSection>
                <Eyebrow>author settings</Eyebrow>
                <PageTitle>Shape the public identity subscribers will see.</PageTitle>
                <p className="mt-4 max-w-2xl text-[var(--muted)]">
                    Keep the author profile focused: a clear name, memorable username, short
                    description, and tags that explain what your content space is about.
                </p>
            </PageSection>

            {authorQuery.isLoading ? (
                <Card>
                    <CardContent className="pt-5 text-[var(--muted)]">
                        Loading author settings...
                    </CardContent>
                </Card>
            ) : authorQuery.data ? (
                <div className="grid gap-6">
                    <AppearancePicker />

                    <AuthorProfileForm
                        author={authorQuery.data}
                        error={updateAuthorMutation.error?.message ?? null}
                        isPending={updateAuthorMutation.isPending}
                        mode="update"
                        onSubmit={(input) => {
                            void updateAuthorMutation.mutateAsync({
                                displayName: input.displayName,
                                bio: input.bio,
                                tags: input.tags,
                            })
                        }}
                    />

                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
                        <Button asChild className="rounded-full" variant="outline">
                            <Link to={`/authors/${authorQuery.data.slug}`}>
                                View public profile
                            </Link>
                        </Button>
                        <button
                            className="text-sm font-medium text-rose-600 underline underline-offset-4 transition hover:text-rose-700 disabled:opacity-60"
                            disabled={deleteAuthorMutation.isPending}
                            onClick={() => setDeleteModalOpen(true)}
                            type="button"
                        >
                            {deleteAuthorMutation.isPending
                                ? "Deleting author account..."
                                : "Delete author account"}
                        </button>
                        {deleteAuthorMutation.isError ? (
                            <p className="mt-2 text-sm text-rose-600">
                                {deleteAuthorMutation.error.message}
                            </p>
                        ) : null}
                    </div>
                </div>
            ) : (
                <Card>
                    <CardContent className="pt-5 text-rose-600">
                        Failed to load author profile.
                    </CardContent>
                </Card>
            )}
            <Modal
                description="Your user wallet account will stay active, but the author profile, posts, projects, access policies, subscription plans, payment intents, and entitlements will be removed from the database."
                onOpenChange={setDeleteModalOpen}
                open={deleteModalOpen}
                title="Delete author account?"
            >
                <div className="flex justify-end gap-2">
                    <Button
                        onClick={() => setDeleteModalOpen(false)}
                        type="button"
                        variant="outline"
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={deleteAuthorMutation.isPending}
                        onClick={() => {
                            void deleteAuthorMutation.mutateAsync().then(() => {
                                setDeleteModalOpen(false)
                                setMode("reader")
                                navigate("/")
                            })
                        }}
                        type="button"
                        variant="destructive"
                    >
                        Delete author account
                    </Button>
                </div>
            </Modal>
        </section>
    )
}
