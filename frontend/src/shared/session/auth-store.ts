import { create } from "zustand"
import { persist } from "zustand/middleware"

interface SessionState {
    token: string | null
    walletAddress: string | null
    setSession: (payload: { token: string; walletAddress: string }) => void
    clearSession: () => void
}

export const useAuthStore = create<SessionState>()(
    persist(
        (set) => ({
            token: null,
            walletAddress: null,
            setSession: ({ token, walletAddress }) => {
                set({ token, walletAddress })
            },
            clearSession: () => {
                set({ token: null, walletAddress: null })
            },
        }),
        {
            name: "usecontent-session",
        }
    )
)
