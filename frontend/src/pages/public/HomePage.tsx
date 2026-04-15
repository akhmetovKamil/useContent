export function HomePage() {
  return (
    <div className="grid gap-6 md:grid-cols-[1.6fr_1fr]">
      <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-6 md:p-8">
        <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
          Frontend shell
        </div>
        <h1 className="mt-4 max-w-3xl font-[var(--serif)] text-4xl leading-none text-[var(--foreground)] md:text-6xl">
          Clean Vite SPA for wallet auth, author pages, posts, and projects.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
          We are keeping the frontend simple on purpose: React SPA, modern Web3
          client stack, and a clear separation from the Encore backend.
        </p>
      </section>

      <section className="rounded-[28px] border border-[var(--line)] bg-[var(--accent-soft)] p-6">
        <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
          Stack
        </div>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--foreground)]">
          <li>Vite + React + TypeScript</li>
          <li>React Router + TanStack Query</li>
          <li>wagmi + viem for EVM wallet flows</li>
          <li>Tailwind v4 as the styling base</li>
          <li>shadcn/ui and Magic UI next</li>
        </ul>
      </section>
    </div>
  );
}
