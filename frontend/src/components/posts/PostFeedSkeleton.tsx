export function PostFeedSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="mx-auto grid w-full max-w-3xl gap-4">
            {Array.from({ length: count }).map((_, index) => (
                <div
                    className="animate-pulse rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"
                    key={index}
                >
                    <div className="h-4 w-40 rounded-full bg-[var(--surface-strong)]" />
                    <div className="mt-4 h-6 w-3/4 rounded-full bg-[var(--surface-strong)]" />
                    <div className="mt-3 grid gap-2">
                        <div className="h-3 rounded-full bg-[var(--surface-strong)]" />
                        <div className="h-3 w-5/6 rounded-full bg-[var(--surface-strong)]" />
                    </div>
                    <div className="mt-5 h-44 rounded-2xl bg-[var(--surface-strong)]" />
                </div>
            ))}
        </div>
    )
}
