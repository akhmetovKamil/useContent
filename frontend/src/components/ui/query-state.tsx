export function LoadingMessage({
    children = "Loading...",
}: {
    children?: string
}) {
    return <p className="text-sm text-[var(--muted)]">{children}</p>
}

export function ErrorMessage({
    children,
}: {
    children: string
}) {
    return <p className="text-sm text-rose-600">{children}</p>
}
