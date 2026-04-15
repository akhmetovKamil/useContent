export function MeProjectsPage() {
  return (
    <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-6 md:p-8">
      <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
        Project manager
      </div>
      <h2 className="mt-3 font-[var(--serif)] text-3xl text-[var(--foreground)]">
        Structured project spaces with gated access
      </h2>
      <p className="mt-3 text-[var(--muted)]">
        This route will use the new `GET /me/projects` and `POST /me/projects`
        backend flow.
      </p>
    </section>
  );
}
