import { create } from "zustand"
import { persist } from "zustand/middleware"

interface SessionState {
    token: string | null
    walletAddress: string | null
    expiresAt: string | null
    authenticatedAt: string | null
    setSession: (payload: { token: string; walletAddress: string; expiresAt: string }) => void
    clearSession: () => void
    clearExpiredSession: () => void
}

const emptySession = {
    token: null,
    walletAddress: null,
    expiresAt: null,
    authenticatedAt: null,
}

export function isSessionExpired(expiresAt: string | null) {
    if (!expiresAt) {
        return true
    }

    const timestamp = Date.parse(expiresAt)
    return Number.isNaN(timestamp) || timestamp <= Date.now()
}

export const useAuthStore = create<SessionState>()(
    persist(
        (set) => ({
            ...emptySession,
            setSession: ({ token, walletAddress, expiresAt }) => {
                set({
                    token,
                    walletAddress,
                    expiresAt,
                    authenticatedAt: new Date().toISOString(),
                })
            },
            clearSession: () => {
                set(emptySession)
            },
            clearExpiredSession: () => {
                set((state) => {
                    if (!state.token || !isSessionExpired(state.expiresAt)) {
                        return state
                    }

                    return emptySession
                })
            },
        }),
        {
            name: "usecontent-session",
            version: 2,
            migrate: (persisted) => {
                const session = persisted as Partial<SessionState>
                if (!session.token || isSessionExpired(session.expiresAt ?? null)) {
                    return emptySession
                }

                return {
                    ...emptySession,
                    token: session.token,
                    walletAddress: session.walletAddress ?? null,
                    expiresAt: session.expiresAt ?? null,
                    authenticatedAt: session.authenticatedAt ?? null,
                }
            },
        }
    )
)
