import axios from "axios"

export interface ApiErrorPayload {
    code?: string
    message?: string
}

export function getApiErrorMessage(error: unknown) {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as ApiErrorPayload | undefined
        return data?.message ?? data?.code ?? error.message
    }

    if (error instanceof Error) {
        return error.message
    }

    return "Request failed"
}

export function normalizeApiError(error: unknown) {
    const message = getApiErrorMessage(error)

    if (error instanceof Error) {
        error.message = message
        return error
    }

    return new Error(message)
}

export function isApiNotFoundError(error: unknown) {
    return axios.isAxiosError(error) && error.response?.status === 404
}

export function isApiPermissionError(error: unknown) {
    return axios.isAxiosError(error) && error.response?.status === 403
}
