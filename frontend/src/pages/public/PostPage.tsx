import { useParams } from "react-router-dom"

export function PostPage() {
    const { slug, postId } = useParams()

    return (
        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-6 md:p-8">
            <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                Post view
            </div>
            <h2 className="mt-3 font-[var(--serif)] text-3xl text-[var(--foreground)]">
                Post {postId}
            </h2>
            <p className="mt-3 text-[var(--muted)]">
                Reader route for author <strong>@{slug}</strong>. This page will consume the gated
                post read flow that is already implemented in the backend.
            </p>
        </section>
    )
}
