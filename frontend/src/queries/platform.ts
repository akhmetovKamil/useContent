import { useQuery } from "@tanstack/react-query"

import { platformApi } from "@/api/PlatformApi"
import { queryKeys } from "./queryKeys"

export function usePlatformPlansQuery() {
    return useQuery({
        queryKey: queryKeys.platformPlans,
        queryFn: () => platformApi.listPlatformPlans(),
    })
}

export function useMyAuthorPlatformBillingQuery(enabled = true) {
    return useQuery({
        queryKey: queryKeys.myAuthorPlatformBilling,
        queryFn: () => platformApi.getMyAuthorPlatformBilling(),
        enabled,
    })
}
