export function MeAuthorPage() {
  return (
    <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-6 md:p-8">
      <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
        Author settings
      </div>
      <h2 className="mt-3 font-[var(--serif)] text-3xl text-[var(--foreground)]">
        Public author identity
      </h2>
      <p className="mt-3 text-[var(--muted)]">
        Slug, display name, bio, and default policy editing will live here.
      </p>
    </section>
  );
}
