import axios from "axios"

import type {
    AuthorProfileDto,
    CreateAuthorProfileInput,
    SubscriptionEntitlementDto,
    UpdateAuthorProfileInput,
    UpdateMyProfileInput,
    UserProfileDto,
} from "@contracts/types/content"

import { http } from "@/utils/api/http"

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
        try {
            const response = await http.post<AuthorProfileDto>("/authors", input)
            return response.data
        } catch (error) {
            throw normalizeApiError(error)
        }
    }

    async updateMyAuthorProfile(input: UpdateAuthorProfileInput) {
        try {
            const response = await http.patch<AuthorProfileDto>("/me/author", input)
            return response.data
        } catch (error) {
            throw normalizeApiError(error)
        }
    }

    async deleteMyAuthorProfile() {
        await http.delete("/me/author")
    }

    async getMyEntitlements() {
        const response = await http.get<{ entitlements: SubscriptionEntitlementDto[] }>(
            "/me/entitlements"
        )
        return response.data.entitlements
    }
}

function normalizeApiError(error: unknown) {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as { code?: string; message?: string } | undefined
        return new Error(data?.message ?? data?.code ?? error.message)
    }

    return error
}

export const profileApi = new ProfileApi()
