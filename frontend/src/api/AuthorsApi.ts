import type {
    AuthorAccessPolicyDto,
    AuthorCatalogItemDto,
    AuthorProfileDto,
    FeedPostDto,
    FeedProjectDto,
    PaginatedResponse,
    SubscriptionPlanDto,
} from "@shared/types/content"

import { getData } from "@/utils/api/http"

class AuthorsApi {
    async listAuthors(search = "") {
        const response = await getData<{ authors: AuthorCatalogItemDto[] }>("/authors", {
            params: search ? { q: search } : undefined,
        })
        return response.authors
    }

    async getAuthorProfile(slug: string) {
        return getData<AuthorProfileDto>(`/authors/${slug}`)
    }

    async listAuthorAccessPolicies(slug: string) {
        const response = await getData<{ policies: AuthorAccessPolicyDto[] }>(
            `/authors/${slug}/access-policies`
        )
        return response.policies
    }

    async listAuthorSubscriptionPlans(slug: string) {
        const response = await getData<{ plans: SubscriptionPlanDto[] }>(
            `/authors/${slug}/subscription-plans`
        )
        return response.plans
    }

    async listAuthorPosts(slug: string, cursor?: string | null, limit = 12) {
        return getData<PaginatedResponse<FeedPostDto>>(`/authors/${slug}/posts`, {
            params: { cursor: cursor ?? undefined, limit },
        })
    }

    async listExploreFeedPosts({
        cursor,
        limit = 12,
        search,
        source = "all",
    }: {
        cursor?: string | null
        limit?: number
        search?: string
        source?: "all" | "public" | "subscribed" | "promoted"
    } = {}) {
        return getData<PaginatedResponse<FeedPostDto>>("/feed", {
            params: {
                cursor: cursor ?? undefined,
                limit,
                q: search || undefined,
                source: source === "all" ? undefined : source,
            },
        })
    }

    async listAuthorProjects(slug: string) {
        const response = await getData<{ projects: FeedProjectDto[] }>(
            `/authors/${slug}/projects`
        )
        return response.projects
    }
}

export const authorsApi = new AuthorsApi()
