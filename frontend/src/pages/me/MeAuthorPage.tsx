import { Link, Navigate } from "react-router-dom"

import { AuthorProfileForm } from "@/components/author-onboarding/AuthorProfileForm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eyebrow, PageSection, PageTitle } from "@/components/ui/page"
import {
    useMyAuthorProfileQuery,
    useUpdateMyAuthorProfileMutation,
} from "@/queries/profile"
import { useAuthStore } from "@/stores/auth-store"
import { isApiNotFoundError } from "@/utils/api/errors"

export function MeAuthorPage() {
    const token = useAuthStore((state) => state.token)
    const authorQuery = useMyAuthorProfileQuery(Boolean(token))
    const updateAuthorMutation = useUpdateMyAuthorProfileMutation()

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
