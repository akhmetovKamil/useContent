import { useQuery } from "@tanstack/react-query"

import { authorsApi } from "@/api/AuthorsApi"
import { queryKeys } from "./queryKeys"

export function useAuthorsQuery(enabled = true, search = "") {
    return useQuery({
        queryKey: queryKeys.authors(search),
        queryFn: () => authorsApi.listAuthors(search),
        enabled,
    })
}

export function useAuthorProfileQuery(slug: string) {
    return useQuery({
        queryKey: queryKeys.author(slug),
        queryFn: () => authorsApi.getAuthorProfile(slug),
        enabled: Boolean(slug),
    })
}

export function useAuthorAccessPoliciesQuery(slug: string) {
    return useQuery({
        queryKey: queryKeys.authorAccessPolicies(slug),
        queryFn: () => authorsApi.listAuthorAccessPolicies(slug),
        enabled: Boolean(slug),
    })
}
