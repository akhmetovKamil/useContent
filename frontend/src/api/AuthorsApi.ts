import type {
    AuthorAccessPolicyDto,
    AuthorCatalogItemDto,
    AuthorProfileDto,
    FeedPostDto,
    FeedProjectDto,
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

    async listAuthorPosts(slug: string) {
        const response = await getData<{ posts: FeedPostDto[] }>(`/authors/${slug}/posts`)
        return response.posts
    }

    async listAuthorProjects(slug: string) {
        const response = await getData<{ projects: FeedProjectDto[] }>(
            `/authors/${slug}/projects`
        )
        return response.projects
    }
}

export const authorsApi = new AuthorsApi()
