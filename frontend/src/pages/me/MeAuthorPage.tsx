import { Link, Navigate, useNavigate } from "react-router-dom"

import { AuthorProfileForm } from "@/components/author-onboarding/AuthorProfileForm"
import { AppearancePicker } from "@/components/settings/AppearancePicker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eyebrow, PageSection, PageTitle } from "@/components/ui/page"
import {
    useDeleteMyAuthorProfileMutation,
    useMyAuthorProfileQuery,
    useUpdateMyAuthorProfileMutation,
} from "@/queries/profile"
import { useAuthStore } from "@/stores/auth-store"
import { useWorkspaceStore } from "@/stores/workspace-store"
import { isApiNotFoundError } from "@/utils/api/errors"

export function MeAuthorPage() {
    const navigate = useNavigate()
    const token = useAuthStore((state) => state.token)
    const setMode = useWorkspaceStore((state) => state.setMode)
    const authorQuery = useMyAuthorProfileQuery(Boolean(token))
    const updateAuthorMutation = useUpdateMyAuthorProfileMutation()
    const deleteAuthorMutation = useDeleteMyAuthorProfileMutation()

    if (!token) {
        return <Navigate replace to="/" />
    }

    if (isApiNotFoundError(authorQuery.error)) {
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
                <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                    <div className="xl:col-span-2">
                        <AppearancePicker />
                    </div>

                    <Card className="rounded-[28px]">
                        <CardHeader>
                            <CardTitle>@{authorQuery.data.slug}</CardTitle>
                            <CardDescription>{authorQuery.data.displayName}</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <p className="text-sm leading-6 text-[var(--muted)]">
                                {authorQuery.data.bio || "No description yet."}
                            </p>
                            {authorQuery.data.tags.length ? (
                                <div className="flex flex-wrap gap-2">
                                    {authorQuery.data.tags.map((tag) => (
                                        <Badge className="rounded-full" key={tag}>
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            ) : null}
                            <Button asChild className="w-fit rounded-full" variant="outline">
                                <Link to={`/authors/${authorQuery.data.slug}`}>
                                    View public profile
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

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

                    <div className="xl:col-start-2">
                        <button
                            className="text-sm font-medium text-rose-600 underline underline-offset-4 transition hover:text-rose-700 disabled:opacity-60"
                            disabled={deleteAuthorMutation.isPending}
                            onClick={() => {
                                const confirmed = window.confirm(
                                    "Delete your author account? Your user wallet account will stay active, but author profile, posts, projects, access policies, subscription plans, payment intents, and entitlements will be removed from the database."
                                )
                                if (!confirmed) {
                                    return
                                }

                                void deleteAuthorMutation.mutateAsync().then(() => {
                                    setMode("reader")
                                    navigate("/")
                                })
                            }}
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
        </section>
    )
}
