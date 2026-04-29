import { feedSourceFilters } from "@/constants/navigation"
import type { FeedSourceFilter } from "@/types/navigation"
import { cn } from "@/utils/cn"

interface FeedSourceFiltersProps {
    value: FeedSourceFilter
    onChange: (value: FeedSourceFilter) => void
}

export function FeedSourceFilters({ value, onChange }: FeedSourceFiltersProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {feedSourceFilters.map((filter) => (
                <button
                    className={cn(
                        "rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium transition",
                        value === filter.id
                            ? "bg-[var(--foreground)] text-[var(--background)]"
                            : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]",
                    )}
                    key={filter.id}
                    onClick={() => onChange(filter.id)}
                    type="button"
                >
                    {filter.label}
                </button>
            ))}
        </div>
    )
}
