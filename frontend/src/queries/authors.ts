import { useQuery } from "@tanstack/react-query"

import { authorsApi } from "@/api/AuthorsApi"
import { queryKeys } from "./queryKeys"

export function useAuthorProfileQuery(slug: string) {
    return useQuery({
        queryKey: queryKeys.author(slug),
        queryFn: () => authorsApi.getAuthorProfile(slug),
        enabled: Boolean(slug),
    })
}
