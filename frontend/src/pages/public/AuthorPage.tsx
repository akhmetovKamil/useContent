import { useParams } from "react-router-dom"

export function AuthorPage() {
    const { slug } = useParams()

    return (
        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-6 md:p-8">
            <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                Author page
            </div>
            <h2 className="mt-3 font-[var(--serif)] text-3xl text-[var(--foreground)]">@{slug}</h2>
            <p className="mt-3 max-w-2xl text-[var(--muted)]">
                Public author profile, published posts, published projects, and subscription
                information will land here next.
            </p>
        </section>
    )
}
