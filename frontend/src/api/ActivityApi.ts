import type { ActivityDto, PaginatedResponse } from "@shared/types/content"
import { getData } from "@/utils/api/http"

class ActivityApi {
    async listMyActivity(cursor?: string | null, limit = 20) {
        return getData<PaginatedResponse<ActivityDto>>("/me/activity", {
            params: { cursor, limit },
        })
    }
}

export const activityApi = new ActivityApi()
