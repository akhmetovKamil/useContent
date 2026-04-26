import type {
    AuthorProfileDto,
    FeedPostDto,
    ListAuthorAccessPoliciesResponseDto,
    ListAuthorProjectsResponseDto,
    ListAuthorsResponseDto,
    ListSubscriptionPlansResponseDto,
    PaginatedResponse,
} from "@shared/types/content"

import { getData } from "@/utils/api/http"
import { unwrapResponseKey } from "@/utils/api/response"
import type { CursorPageInput, ExploreFeedInput, SearchAuthorsInput } from "@/types/api"

class AuthorsApi {
    async listAuthors(search = "") {
        const response = await getData<ListAuthorsResponseDto, SearchAuthorsInput>("/authors", {
            params: { q: search },
        })
        return unwrapResponseKey(response, "authors")
    }

    async getAuthorProfile(slug: string) {
        return getData<AuthorProfileDto>(`/authors/${slug}`)
    }

    async listAuthorAccessPolicies(slug: string) {
        const response = await getData<ListAuthorAccessPoliciesResponseDto>(
            `/authors/${slug}/access-policies`
        )
        return unwrapResponseKey(response, "policies")
    }

    async listAuthorSubscriptionPlans(slug: string) {
        const response = await getData<ListSubscriptionPlansResponseDto>(
            `/authors/${slug}/subscription-plans`
        )
        return unwrapResponseKey(response, "plans")
    }

    async listAuthorPosts(slug: string, cursor?: string | null, limit = 12) {
        return getData<PaginatedResponse<FeedPostDto>, CursorPageInput>(`/authors/${slug}/posts`, {
            params: { cursor, limit },
        })
    }

    async listExploreFeedPosts({ cursor, limit = 12, q, source = "all" }: ExploreFeedInput = {}) {
        return getData<PaginatedResponse<FeedPostDto>, ExploreFeedInput>("/feed", {
            params: {
                cursor,
                limit,
                q,
                source,
            },
        })
    }

    async listAuthorProjects(slug: string) {
        const response = await getData<ListAuthorProjectsResponseDto>(
            `/authors/${slug}/projects`
        )
        return unwrapResponseKey(response, "projects")
    }
}

export const authorsApi = new AuthorsApi()
