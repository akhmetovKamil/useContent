import type { AuthorProfileDto, CreateAuthorProfileInput, UpdateAuthorProfileInput, UpdateMyProfileInput, UserProfileDto } from "@shared/types/profile"
import type { FeedPostDto } from "@shared/types/posts"
import type { ListAuthorSubscribersResponseDto, ListEntitlementsResponseDto, ListReaderSubscriptionsResponseDto } from "@shared/types/responses"
import type { PaginatedResponse } from "@shared/types/common"

import {
    deleteData,
    getData,
    patchData,
    postData,
    uploadData,
} from "@/utils/api/http"
import { unwrapResponseKey } from "@/utils/api/response"
import type { CursorPageInput } from "@/types/api"

class ProfileApi {
    async getMe() {
        return getData<UserProfileDto>("/me")
    }

    async updateMe(input: UpdateMyProfileInput) {
        return patchData<UserProfileDto>("/me", input)
    }

    async uploadMyProfileAvatar(file: File) {
        return uploadData<UserProfileDto>("/me/avatar", file, {
            headers: { "Content-Type": file.type || "application/octet-stream" },
        })
    }

    async getMyAuthorProfile() {
        return getData<AuthorProfileDto>("/me/author")
    }

    async createMyAuthorProfile(input: CreateAuthorProfileInput) {
        return postData<AuthorProfileDto>("/authors", input)
    }

    async updateMyAuthorProfile(input: UpdateAuthorProfileInput) {
        return patchData<AuthorProfileDto>("/me/author", input)
    }

    async uploadMyAuthorAvatar(file: File) {
        return uploadData<AuthorProfileDto>("/me/author/avatar", file, {
            headers: { "Content-Type": file.type || "application/octet-stream" },
        })
    }

    async deleteMyAuthorProfile() {
        await deleteData("/me/author")
    }

    async getMyEntitlements() {
        const response = await getData<ListEntitlementsResponseDto>(
            "/me/entitlements"
        )
        return unwrapResponseKey(response, "entitlements")
    }

    async getMyReaderSubscriptions() {
        const response = await getData<ListReaderSubscriptionsResponseDto>(
            "/me/subscriptions"
        )
        return unwrapResponseKey(response, "subscriptions")
    }

    async getMyFeedPosts(cursor?: string | null, limit = 12) {
        return getData<PaginatedResponse<FeedPostDto>, CursorPageInput>("/me/feed", {
            params: { cursor, limit },
        })
    }

    async getMyAuthorSubscribers() {
        const response = await getData<ListAuthorSubscribersResponseDto>(
            "/me/author/subscribers"
        )
        return unwrapResponseKey(response, "subscribers")
    }
}

export const profileApi = new ProfileApi()
