export function MePage() {
  return (
    <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-6 md:p-8">
      <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
        Personal cabinet
      </div>
      <h2 className="mt-3 font-[var(--serif)] text-3xl text-[var(--foreground)]">
        Wallet, profile, and private dashboard
      </h2>
      <p className="mt-3 max-w-2xl text-[var(--muted)]">
        This route will use `GET /me`, `GET /me/author`, and
        `GET /me/entitlements` as soon as we wire the first API client layer.
      </p>
    </section>
  );
}
