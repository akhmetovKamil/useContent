import type {
    AuthorProfileDto,
    CreateAuthorProfileInput,
    FeedPostDto,
    ListAuthorSubscribersResponseDto,
    ListEntitlementsResponseDto,
    ListReaderSubscriptionsResponseDto,
    PaginatedResponse,
    UpdateAuthorProfileInput,
    UpdateMyProfileInput,
    UserProfileDto,
} from "@shared/types/content"

import {
    deleteData,
    getData,
    patchData,
    postData,
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

    async getMyAuthorProfile() {
        return getData<AuthorProfileDto>("/me/author")
    }

    async createMyAuthorProfile(input: CreateAuthorProfileInput) {
        return postData<AuthorProfileDto>("/authors", input)
    }

    async updateMyAuthorProfile(input: UpdateAuthorProfileInput) {
        return patchData<AuthorProfileDto>("/me/author", input)
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
