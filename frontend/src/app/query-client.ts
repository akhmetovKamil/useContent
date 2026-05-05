import { MutationCache, QueryClient } from "@tanstack/react-query"

import { toast } from "@/components/ui/sonner"
import { getUserErrorMessage } from "@/utils/api/errors"

export const queryClient = new QueryClient({
    mutationCache: new MutationCache({
        onError: (error) => {
            toast.error(getUserErrorMessage(error instanceof Error ? error.message : "Action failed"))
        },
    }),
})
