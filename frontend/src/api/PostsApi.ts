import type {
    CreatePostCommentInput,
    CreatePostInput,
    PostAttachmentDto,
    PostCommentDto,
    PostDto,
    RecordPostViewInput,
    UpdatePostInput,
} from "@shared/types/content"

import { http } from "@/utils/api/http"
import { downloadBlob } from "@/utils/download-blob"

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

    async uploadMyPostAttachment(postId: string, file: File) {
        const response = await http.post<PostAttachmentDto>(
            `/me/post-files/upload/${postId}`,
            file,
            {
                headers: { "Content-Type": file.type || "application/octet-stream" },
                params: { name: file.name },
            }
        )
        return response.data
    }

    async downloadMyPostAttachment(postId: string, attachmentId: string, fileName: string) {
        const response = await http.get<Blob>(`/me/post-files/download/${postId}/${attachmentId}`, {
            responseType: "blob",
        })
        downloadBlob(response.data, fileName)
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

    async recordPostView(slug: string, postId: string, input: RecordPostViewInput) {
        const response = await http.post<{ viewsCount: number }>(
            `/authors/${slug}/posts/${postId}/view`,
            input
        )
        return response.data
    }

    async downloadAuthorPostAttachment(
        slug: string,
        postId: string,
        attachmentId: string,
        fileName: string
    ) {
        const response = await http.get<Blob>(
            `/post-files/download/${slug}/${postId}/${attachmentId}`,
            {
                responseType: "blob",
            }
        )
        downloadBlob(response.data, fileName)
    }
}

export const postsApi = new PostsApi()
