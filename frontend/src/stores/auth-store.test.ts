import { beforeEach, describe, expect, test, vi } from "vitest"

import { isSessionExpired, useAuthStore } from "@/stores/auth-store"

describe("auth store", () => {
    beforeEach(() => {
        useAuthStore.getState().clearSession()
    })

    test("tracks active session metadata", () => {
        const expiresAt = new Date(Date.now() + 60_000).toISOString()

        useAuthStore.getState().setSession({
            expiresAt,
            token: "jwt",
            walletAddress: "0xabc",
        })

        expect(useAuthStore.getState().token).toBe("jwt")
        expect(useAuthStore.getState().walletAddress).toBe("0xabc")
        expect(useAuthStore.getState().expiresAt).toBe(expiresAt)
        expect(useAuthStore.getState().authenticatedAt).toBeTruthy()
    })

    test("clears expired sessions", () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date("2026-04-28T12:00:00.000Z"))
        useAuthStore.getState().setSession({
            expiresAt: "2026-04-28T11:59:59.000Z",
            token: "jwt",
            walletAddress: "0xabc",
        })

        useAuthStore.getState().clearExpiredSession()

        expect(useAuthStore.getState().token).toBeNull()
        vi.useRealTimers()
    })

    test("detects invalid or missing expiration as expired", () => {
        expect(isSessionExpired(null)).toBe(true)
        expect(isSessionExpired("not-a-date")).toBe(true)
    })
})
