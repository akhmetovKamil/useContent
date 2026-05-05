import { useEffect } from "react"

import { toast, Toaster } from "@/components/ui/sonner"
import { SESSION_EXPIRED_EVENT } from "@/utils/session-events"

export function AppToaster() {
    useEffect(() => {
        function handleSessionExpired() {
            toast.warning("Session expired. Please sign in again.")
        }

        window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
        return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
    }, [])

    return <Toaster />
}
