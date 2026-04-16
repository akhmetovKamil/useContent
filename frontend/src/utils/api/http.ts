import axios from "axios"

import { useAuthStore } from "@/stores/auth-store"
import { env } from "@/utils/config/env"

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
