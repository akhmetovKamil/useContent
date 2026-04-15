import type {
    AuthorProfileDto,
    PostDto,
    ProjectDto,
    SubscriptionPlanDto,
} from "@contracts/types/content"

import { http } from "@/lib/api/http"

class AuthorsApi {
    async getAuthorProfile(slug: string) {
        const response = await http.get<AuthorProfileDto>(`/authors/${slug}`)
        return response.data
    }

    async getAuthorSubscriptionPlan(slug: string) {
        const response = await http.get<SubscriptionPlanDto>(`/authors/${slug}/subscription-plan`)
        return response.data
    }

    async listAuthorPosts(slug: string) {
        const response = await http.get<{ posts: PostDto[] }>(`/authors/${slug}/posts`)
        return response.data.posts
    }

    async listAuthorProjects(slug: string) {
        const response = await http.get<{ projects: ProjectDto[] }>(`/authors/${slug}/projects`)
        return response.data.projects
    }
}

export const authorsApi = new AuthorsApi()
