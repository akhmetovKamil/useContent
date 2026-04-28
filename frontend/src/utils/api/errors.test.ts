import axios, { AxiosError } from "axios"
import { describe, expect, test } from "vitest"

import {
    AppError,
    getApiErrorMessage,
    isAuthError,
    isApiNotFoundError,
    isNetworkError,
    normalizeApiError,
} from "@/utils/api/errors"

describe("api error helpers", () => {
    test("reads backend message from axios error payload", () => {
        const error = new AxiosError("Network")
        error.response = {
            data: { message: "author slug already exists" },
            status: 409,
            statusText: "Conflict",
            headers: {},
            config: {} as never,
        }

        expect(getApiErrorMessage(error)).toBe("This username is already taken.")
    })

    test("falls back to backend code when message is missing", () => {
        const error = new AxiosError("Network")
        error.response = {
            data: { code: "not_found" },
            status: 404,
            statusText: "Not Found",
            headers: {},
            config: {} as never,
        }

        expect(getApiErrorMessage(error)).toBe("not_found")
    })

    test("uses generic Error message when value is not axios", () => {
        expect(getApiErrorMessage(new Error("plain error"))).toBe("plain error")
    })

    test("returns fallback text for unknown values", () => {
        expect(getApiErrorMessage("oops")).toBe("Request failed")
    })

    test("normalizes axios errors into app errors", () => {
        const error = new AxiosError("Network")
        error.response = {
            data: { message: "normalized" },
            status: 400,
            statusText: "Bad Request",
            headers: {},
            config: {} as never,
        }

        const normalized = normalizeApiError(error)

        expect(normalized).toBeInstanceOf(AppError)
        expect(normalized.message).toBe("normalized")
        expect(normalized.status).toBe(400)
    })

    test("creates new error for non-error values", () => {
        const normalized = normalizeApiError({ foo: "bar" })

        expect(normalized).toBeInstanceOf(Error)
        expect(normalized.message).toBe("Request failed")
    })

    test("detects auth and network errors", () => {
        const authError = new AppError("Session expired", { status: 401 })
        const networkError = new AppError("Backend down", { isNetworkError: true })

        expect(isAuthError(authError)).toBe(true)
        expect(isNetworkError(networkError)).toBe(true)
    })

    test("detects axios 404 as not found", () => {
        const error = new AxiosError("Network")
        error.response = {
            data: {},
            status: 404,
            statusText: "Not Found",
            headers: {},
            config: {} as never,
        }

        expect(isApiNotFoundError(error)).toBe(true)
    })

    test("does not treat non-axios errors as not found", () => {
        expect(isApiNotFoundError(new Error("x"))).toBe(false)
        expect(isApiNotFoundError(axios.create())).toBe(false)
    })
})
