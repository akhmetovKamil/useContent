import { Moon, Sun } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import type * as React from "react"
import { flushSync } from "react-dom"

import { cn } from "@/lib/utils"

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
    checked?: boolean
    duration?: number
    onCheckedChange?: (checked: boolean) => void
}

export const AnimatedThemeToggler = ({
    checked,
    className,
    duration = 400,
    onCheckedChange,
    ...props
}: AnimatedThemeTogglerProps) => {
    const [internalDark, setInternalDark] = useState(false)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const isDark = checked ?? internalDark

    useEffect(() => {
        const updateTheme = () => {
            setInternalDark(document.documentElement.classList.contains("dark"))
        }

        updateTheme()

        const observer = new MutationObserver(updateTheme)
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        })

        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (checked === undefined) {
            return
        }

        document.documentElement.classList.toggle("dark", checked)
        localStorage.setItem("theme", checked ? "dark" : "light")
    }, [checked])

    const toggleTheme = useCallback(() => {
        const button = buttonRef.current
        if (!button) return

        const { top, left, width, height } = button.getBoundingClientRect()
        const x = left + width / 2
        const y = top + height / 2
        const viewportWidth = window.visualViewport?.width ?? window.innerWidth
        const viewportHeight = window.visualViewport?.height ?? window.innerHeight
        const maxRadius = Math.hypot(
            Math.max(x, viewportWidth - x),
            Math.max(y, viewportHeight - y)
        )

        const applyTheme = () => {
            const nextTheme = !isDark
            if (checked === undefined) {
                setInternalDark(nextTheme)
            }
            document.documentElement.classList.toggle("dark", nextTheme)
            localStorage.setItem("theme", nextTheme ? "dark" : "light")
            onCheckedChange?.(nextTheme)
        }

        if (typeof document.startViewTransition !== "function") {
            applyTheme()
            return
        }

        const transition = document.startViewTransition(() => {
            flushSync(applyTheme)
        })

        const ready = transition?.ready
        if (ready && typeof ready.then === "function") {
            ready.then(() => {
                document.documentElement.animate(
                    {
                        clipPath: [
                            `circle(0px at ${x}px ${y}px)`,
                            `circle(${maxRadius}px at ${x}px ${y}px)`,
                        ],
                    },
                    {
                        duration,
                        easing: "ease-in-out",
                        pseudoElement: "::view-transition-new(root)",
                    }
                )
            })
        }
    }, [checked, duration, isDark, onCheckedChange])

    return (
        <button
            className={cn(className)}
            onClick={toggleTheme}
            ref={buttonRef}
            type="button"
            {...props}
        >
            {isDark ? <Sun /> : <Moon />}
            <span className="sr-only">Toggle theme</span>
        </button>
    )
}
