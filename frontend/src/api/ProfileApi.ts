import type {
    AuthorProfileDto,
    AuthorSubscriberDto,
    CreateAuthorProfileInput,
    FeedPostDto,
    ReaderSubscriptionDto,
    SubscriptionEntitlementDto,
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
        const response = await getData<{ entitlements: SubscriptionEntitlementDto[] }>(
            "/me/entitlements"
        )
        return response.entitlements
    }

    async getMyReaderSubscriptions() {
        const response = await getData<{ subscriptions: ReaderSubscriptionDto[] }>(
            "/me/subscriptions"
        )
        return response.subscriptions
    }

    async getMyFeedPosts() {
        const response = await getData<{ posts: FeedPostDto[] }>("/me/feed")
        return response.posts
    }

    async getMyAuthorSubscribers() {
        const response = await getData<{ subscribers: AuthorSubscriberDto[] }>(
            "/me/author/subscribers"
        )
        return response.subscribers
    }
}

export const profileApi = new ProfileApi()
