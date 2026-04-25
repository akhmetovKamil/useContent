import type {
    CreatePostCommentInput,
    CreatePostReportInput,
    CreatePostInput,
    PostAttachmentDto,
    PostCommentDto,
    PostReportDto,
    PostDto,
    RecordPostViewInput,
    UpdatePostInput,
} from "@shared/types/content"

import { downloadBlob } from "@/utils/download-blob"
import {
    deleteData,
    downloadData,
    getData,
    patchData,
    postData,
    uploadData,
} from "@/utils/api/http"

class PostsApi {
    async createMyPost(input: CreatePostInput) {
        return postData<PostDto>("/me/posts", input)
    }

    async listMyPosts(status?: PostDto["status"]) {
        const response = await getData<{ posts: PostDto[] }>("/me/posts", {
            params: { status },
        })
        return response.posts
    }

    async updateMyPost(postId: string, input: UpdatePostInput) {
        return patchData<PostDto>(`/me/posts/${postId}`, input)
    }

    async deleteMyPost(postId: string) {
        await deleteData(`/me/posts/${postId}`)
    }

    async promoteMyPost(postId: string) {
        return postData<PostDto>(`/me/posts/${postId}/promotion`)
    }

    async stopPromotingMyPost(postId: string) {
        return deleteData<PostDto>(`/me/posts/${postId}/promotion`)
    }

    async uploadMyPostAttachment(postId: string, file: File) {
        return uploadData<PostAttachmentDto>(
            `/me/post-files/upload/${postId}`,
            file,
            {
                headers: { "Content-Type": file.type || "application/octet-stream" },
                params: { name: file.name },
            }
        )
    }

    async downloadMyPostAttachment(postId: string, attachmentId: string, fileName: string) {
        const file = await downloadData(`/me/post-files/download/${postId}/${attachmentId}`)
        downloadBlob(file, fileName)
    }

    async getAuthorPost(slug: string, postId: string) {
        return getData<PostDto>(`/authors/${slug}/posts/${postId}`)
    }

    async listPostComments(slug: string, postId: string) {
        const response = await getData<{ comments: PostCommentDto[] }>(
            `/authors/${slug}/posts/${postId}/comments`
        )
        return response.comments
    }

    async createPostComment(slug: string, postId: string, input: CreatePostCommentInput) {
        return postData<PostCommentDto>(
            `/authors/${slug}/posts/${postId}/comments`,
            input
        )
    }

    async createPostReport(slug: string, postId: string, input: CreatePostReportInput) {
        return postData<PostReportDto>(`/authors/${slug}/posts/${postId}/report`, input)
    }

    async togglePostLike(slug: string, postId: string) {
        return postData<{ liked: boolean; likesCount: number }>(
            `/authors/${slug}/posts/${postId}/like`
        )
    }

    async recordPostView(slug: string, postId: string, input: RecordPostViewInput) {
        return postData<{ viewsCount: number }>(
            `/authors/${slug}/posts/${postId}/view`,
            input
        )
    }

    async downloadAuthorPostAttachment(
        slug: string,
        postId: string,
        attachmentId: string,
        fileName: string
    ) {
        const file = await downloadData(
            `/post-files/download/${slug}/${postId}/${attachmentId}`
        )
        downloadBlob(file, fileName)
    }
}

export const postsApi = new PostsApi()
