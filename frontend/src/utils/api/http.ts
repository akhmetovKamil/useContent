import axios, { type AxiosRequestConfig } from "axios"

import { queryClient } from "@/app/query-client"
import { useAuthStore } from "@/stores/auth-store"
import { env } from "@/utils/config/env"
import { normalizeApiError } from "@/utils/api/errors"
import { emitSessionExpired } from "@/utils/session-events"

export const http = axios.create({
    baseURL: env.apiBaseUrl,
})

export type ApiQueryPrimitive = string | number | boolean | null | undefined

export type ApiQueryParams = Record<
    string,
    ApiQueryPrimitive | readonly ApiQueryPrimitive[]
>

export interface ApiRequestConfig<TParams extends object = ApiQueryParams>
    extends Omit<AxiosRequestConfig, "params"> {
    params?: TParams
}

http.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})

http.interceptors.response.use(
    (response) => response,
    (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            const { token, clearSession } = useAuthStore.getState()
            if (token) {
                clearSession()
                queryClient.clear()
                emitSessionExpired()
            }
        }

        return Promise.reject(error)
    }
)

export async function request<TResponse, TParams extends object = ApiQueryParams>(
    config: ApiRequestConfig<TParams>
) {
    try {
        const response = await http.request<TResponse>({
            ...config,
            params: config.params ? toQueryParams(config.params) : undefined,
        })
        return response.data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export function getData<TResponse, TParams extends object = ApiQueryParams>(
    url: string,
    config?: ApiRequestConfig<TParams>
) {
    return request<TResponse, TParams>({ ...config, method: "GET", url })
}

export function postData<
    TResponse,
    TBody = unknown,
    TParams extends object = ApiQueryParams,
>(url: string, data?: TBody, config?: ApiRequestConfig<TParams>) {
    return request<TResponse, TParams>({ ...config, data, method: "POST", url })
}

export function putData<
    TResponse,
    TBody = unknown,
    TParams extends object = ApiQueryParams,
>(url: string, data?: TBody, config?: ApiRequestConfig<TParams>) {
    return request<TResponse, TParams>({ ...config, data, method: "PUT", url })
}

export function patchData<
    TResponse,
    TBody = unknown,
    TParams extends object = ApiQueryParams,
>(url: string, data?: TBody, config?: ApiRequestConfig<TParams>) {
    return request<TResponse, TParams>({ ...config, data, method: "PATCH", url })
}

export function deleteData<
    TResponse = void,
    TParams extends object = ApiQueryParams,
>(url: string, config?: ApiRequestConfig<TParams>) {
    return request<TResponse, TParams>({ ...config, method: "DELETE", url })
}

export function uploadData<TResponse, TParams extends object = ApiQueryParams>(
    url: string,
    file: File | Blob,
    config?: ApiRequestConfig<TParams>
) {
    return request<TResponse, TParams>({
        ...config,
        data: file,
        method: "POST",
        url,
    })
}

export function downloadData(
    url: string,
    config?: ApiRequestConfig
) {
    return request<Blob>({
        ...config,
        method: "GET",
        responseType: "blob",
        url,
    })
}

export function toQueryParams<TParams extends object>(params: TParams) {
    const nextParams: Record<string, string | number | boolean | Array<string | number | boolean>> =
        {}

    for (const [key, value] of Object.entries(params) as Array<
        [string, ApiQueryPrimitive | readonly ApiQueryPrimitive[]]
    >) {
        if (isQueryArray(value)) {
            const values = value.filter(isSerializableQueryValue)
            if (values.length) {
                nextParams[key] = values
            }
            continue
        }

        if (isSerializableQueryValue(value)) {
            nextParams[key] = value
        }
    }

    return nextParams
}

function isQueryArray(
    value: ApiQueryPrimitive | readonly ApiQueryPrimitive[]
): value is readonly ApiQueryPrimitive[] {
    return Array.isArray(value)
}

function isSerializableQueryValue(
    value: ApiQueryPrimitive
): value is string | number | boolean {
    return value !== null && value !== undefined && value !== ""
}
