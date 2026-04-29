import type { ActivityDto } from "@shared/types/posts"
import type { PaginatedResponse } from "@shared/types/common"
import { getData } from "@/utils/api/http"

class ActivityApi {
    async listMyActivity(cursor?: string | null, limit = 20) {
        return getData<PaginatedResponse<ActivityDto>>("/me/activity", {
            params: { cursor, limit },
        })
    }
}

export const activityApi = new ActivityApi()
