import axios, { type AxiosRequestConfig } from "axios"

import { useAuthStore } from "@/stores/auth-store"
import { env } from "@/utils/config/env"
import { normalizeApiError } from "@/utils/api/errors"

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

export async function request<T>(config: AxiosRequestConfig) {
    try {
        const response = await http.request<T>(config)
        return response.data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export function getData<T>(url: string, config?: AxiosRequestConfig) {
    return request<T>({ ...config, method: "GET", url })
}

export function postData<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return request<T>({ ...config, data, method: "POST", url })
}

export function putData<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return request<T>({ ...config, data, method: "PUT", url })
}

export function patchData<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return request<T>({ ...config, data, method: "PATCH", url })
}

export function deleteData<T = void>(url: string, config?: AxiosRequestConfig) {
    return request<T>({ ...config, method: "DELETE", url })
}

export function uploadData<T>(
    url: string,
    file: File | Blob,
    config?: AxiosRequestConfig
) {
    return request<T>({
        ...config,
        data: file,
        method: "POST",
        url,
    })
}

export function downloadData(
    url: string,
    config?: AxiosRequestConfig
) {
    return request<Blob>({
        ...config,
        method: "GET",
        responseType: "blob",
        url,
    })
}
