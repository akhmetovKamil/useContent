import axios from "axios"

import { env } from "@/shared/config/env"
import { useAuthStore } from "@/shared/session/auth-store"

export const http = axios.create({
    baseURL: env.apiBaseUrl,
})

http.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})
