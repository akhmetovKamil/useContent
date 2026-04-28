import axios from "axios"

export interface ApiErrorPayload {
    code?: string
    details?: unknown
    message?: string
}

export class AppError extends Error {
    code?: string
    details?: unknown
    isNetworkError: boolean
    status?: number

    constructor(message: string, options: Partial<AppError> = {}) {
        super(message)
        this.name = "AppError"
        this.code = options.code
        this.details = options.details
        this.isNetworkError = options.isNetworkError ?? false
        this.status = options.status
    }
}

export function getApiErrorMessage(error: unknown) {
    if (error instanceof AppError) {
        return error.message
    }

    if (axios.isAxiosError(error)) {
        const data = error.response?.data as ApiErrorPayload | undefined
        if (!error.response) {
            return "Backend is not reachable. Please try again later."
        }

        return getUserErrorMessage(data?.message ?? data?.code ?? error.message)
    }

    if (error instanceof Error) {
        return error.message
    }

    return "Request failed"
}

export function normalizeApiError(error: unknown) {
    if (error instanceof AppError) {
        return error
    }

    if (axios.isAxiosError(error)) {
        const data = error.response?.data as ApiErrorPayload | undefined
        const message = getUserErrorMessage(data?.message ?? data?.code ?? error.message)

        return new AppError(message, {
            code: data?.code,
            details: data?.details,
            isNetworkError: !error.response,
            status: error.response?.status,
        })
    }

    return new AppError(getApiErrorMessage(error))
}

export function getUserErrorMessage(message: string) {
    const normalized = message.toLowerCase()

    if (normalized.includes("network error") || normalized.includes("failed to fetch")) {
        return "Backend is not reachable. Please try again later."
    }
    if (normalized.includes("invalid or expired token") || normalized.includes("unauthenticated")) {
        return "Session expired. Please sign in again."
    }
    if (normalized.includes("author slug already exists")) {
        return "This username is already taken."
    }
    if (normalized.includes("storage quota exceeded")) {
        return "Storage quota exceeded. Free up space or upgrade your plan."
    }
    if (normalized.includes("feature not available")) {
        return "This feature is not available on your current plan."
    }

    return message
}

export function isAuthError(error: unknown) {
    return getErrorStatus(error) === 401
}

export function isNetworkError(error: unknown) {
    return error instanceof AppError && error.isNetworkError
}

export function isValidationError(error: unknown) {
    return getErrorStatus(error) === 400
}

export function isApiNotFoundError(error: unknown) {
    return getErrorStatus(error) === 404
}

export function isApiPermissionError(error: unknown) {
    return getErrorStatus(error) === 403
}

function getErrorStatus(error: unknown) {
    if (error instanceof AppError) {
        return error.status
    }
    if (axios.isAxiosError(error)) {
        return error.response?.status
    }

    return undefined
}
