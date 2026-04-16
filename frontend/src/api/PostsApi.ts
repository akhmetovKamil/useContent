import type { CreatePostInput, PostDto, UpdatePostInput } from "@contracts/types/content"

import { http } from "@/lib/api/http"

class PostsApi {
    async createMyPost(input: CreatePostInput) {
        const response = await http.post<PostDto>("/me/posts", input)
        return response.data
    }

    async listMyPosts() {
        const response = await http.get<{ posts: PostDto[] }>("/me/posts")
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
}

export const postsApi = new PostsApi()
