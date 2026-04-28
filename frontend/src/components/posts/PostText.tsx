import { cn } from "@/utils/cn"

export function PostText({
    content,
    expanded,
    onToggle,
}: {
    content: string
    expanded: boolean
    onToggle: () => void
}) {
    const isLong = content.length > 420

    return (
        <div className="grid gap-2">
            <p
                className={cn(
                    "whitespace-pre-wrap text-sm leading-6 text-[var(--foreground)]",
                    isLong && !expanded ? "line-clamp-5" : ""
                )}
            >
                {content}
            </p>
            {isLong ? (
                <button
                    className="w-fit text-sm font-medium text-[var(--accent)] underline-offset-4 hover:underline"
                    onClick={onToggle}
                    type="button"
                >
                    {expanded ? "Show less" : "Show more"}
                </button>
            ) : null}
        </div>
    )
}
