import { useQuery } from "@tanstack/react-query"

import { profileApi } from "@/api/ProfileApi"
import { queryKeys } from "./queryKeys"

export function useMeQuery(enabled = true) {
    return useQuery({
        queryKey: queryKeys.me,
        queryFn: () => profileApi.getMe(),
        enabled,
    })
}

export function useMyAuthorProfileQuery(enabled = true) {
    return useQuery({
        queryKey: queryKeys.myAuthor,
        queryFn: () => profileApi.getMyAuthorProfile(),
        enabled,
    })
}

export function useMyEntitlementsQuery(enabled = true) {
    return useQuery({
        queryKey: queryKeys.myEntitlements,
        queryFn: () => profileApi.getMyEntitlements(),
        enabled,
    })
}
