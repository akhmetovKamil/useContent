import { useEffect } from "react"

export function useOverlayEffects(open: boolean, onOpenChange: (open: boolean) => void) {
    useEffect(() => {
        if (!open) {
            return
        }

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                onOpenChange(false)
            }
        }

        window.addEventListener("keydown", handleKeyDown)

        return () => {
            document.body.style.overflow = previousOverflow
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [onOpenChange, open])
}
