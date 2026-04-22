import type {
    AuthorAccessPolicyDto,
    AuthorCatalogItemDto,
    AuthorProfileDto,
    FeedPostDto,
    FeedProjectDto,
    SubscriptionPlanDto,
} from "@contracts/types/content"

import { http } from "@/utils/api/http"

class AuthorsApi {
    async listAuthors(search = "") {
        const response = await http.get<{ authors: AuthorCatalogItemDto[] }>("/authors", {
            params: search ? { q: search } : undefined,
        })
        return response.data.authors
    }

    async getAuthorProfile(slug: string) {
        const response = await http.get<AuthorProfileDto>(`/authors/${slug}`)
        return response.data
    }

    async listAuthorAccessPolicies(slug: string) {
        const response = await http.get<{ policies: AuthorAccessPolicyDto[] }>(
            `/authors/${slug}/access-policies`
        )
        return response.data.policies
    }

    async listAuthorSubscriptionPlans(slug: string) {
        const response = await http.get<{ plans: SubscriptionPlanDto[] }>(
            `/authors/${slug}/subscription-plans`
        )
        return response.data.plans
    }

    async listAuthorPosts(slug: string) {
        const response = await http.get<{ posts: FeedPostDto[] }>(`/authors/${slug}/posts`)
        return response.data.posts
    }

    async listAuthorProjects(slug: string) {
        const response = await http.get<{ projects: FeedProjectDto[] }>(`/authors/${slug}/projects`)
        return response.data.projects
    }
}

export const authorsApi = new AuthorsApi()
