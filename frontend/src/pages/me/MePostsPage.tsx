export function MePostsPage() {
    return (
        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-6 md:p-8">
            <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                Post manager
            </div>
            <h2 className="mt-3 font-[var(--serif)] text-3xl text-[var(--foreground)]">
                Drafts, published posts, and access rules
            </h2>
            <p className="mt-3 text-[var(--muted)]">
                This route is ready to connect to `GET /me/posts` and `POST /me/posts`.
            </p>
        </section>
    )
}
