import type {
    AuthorProfileDto,
    CreateAuthorProfileInput,
    SubscriptionEntitlementDto,
    UpdateAuthorProfileInput,
    UpdateMyProfileInput,
    UserProfileDto,
} from "@contracts/types/content"

import { http } from "@/lib/api/http"

class ProfileApi {
    async getMe() {
        const response = await http.get<UserProfileDto>("/me")
        return response.data
    }

    async updateMe(input: UpdateMyProfileInput) {
        const response = await http.patch<UserProfileDto>("/me", input)
        return response.data
    }

    async getMyAuthorProfile() {
        const response = await http.get<AuthorProfileDto>("/me/author")
        return response.data
    }

    async createMyAuthorProfile(input: CreateAuthorProfileInput) {
        const response = await http.post<AuthorProfileDto>("/authors", input)
        return response.data
    }

    async updateMyAuthorProfile(input: UpdateAuthorProfileInput) {
        const response = await http.patch<AuthorProfileDto>("/me/author", input)
        return response.data
    }

    async getMyEntitlements() {
        const response = await http.get<{ entitlements: SubscriptionEntitlementDto[] }>(
            "/me/entitlements"
        )
        return response.data.entitlements
    }
}

export const profileApi = new ProfileApi()
