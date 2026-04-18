import type {
    CreatePostCommentInput,
    CreatePostInput,
    PostCommentDto,
    PostDto,
    UpdatePostInput,
} from "@contracts/types/content"

import { http } from "@/utils/api/http"

class PostsApi {
    async createMyPost(input: CreatePostInput) {
        const response = await http.post<PostDto>("/me/posts", input)
        return response.data
    }

    async listMyPosts(status?: PostDto["status"]) {
        const response = await http.get<{ posts: PostDto[] }>("/me/posts", {
            params: { status },
        })
        return response.data.posts
    }

    async updateMyPost(postId: string, input: UpdatePostInput) {
        const response = await http.patch<PostDto>(`/me/posts/${postId}`, input)
        return response.data
    }

    async deleteMyPost(postId: string) {
        await http.delete(`/me/posts/${postId}`)
    }

    async getAuthorPost(slug: string, postId: string) {
        const response = await http.get<PostDto>(`/authors/${slug}/posts/${postId}`)
        return response.data
    }

    async listPostComments(slug: string, postId: string) {
        const response = await http.get<{ comments: PostCommentDto[] }>(
            `/authors/${slug}/posts/${postId}/comments`
        )
        return response.data.comments
    }

    async createPostComment(slug: string, postId: string, input: CreatePostCommentInput) {
        const response = await http.post<PostCommentDto>(
            `/authors/${slug}/posts/${postId}/comments`,
            input
        )
        return response.data
    }

    async togglePostLike(slug: string, postId: string) {
        const response = await http.post<{ liked: boolean; likesCount: number }>(
            `/authors/${slug}/posts/${postId}/like`
        )
        return response.data
    }
}

export const postsApi = new PostsApi()
