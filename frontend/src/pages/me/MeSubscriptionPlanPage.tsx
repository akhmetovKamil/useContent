export function MeSubscriptionPlanPage() {
    return (
        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-6 md:p-8">
            <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                Monetization
            </div>
            <h2 className="mt-3 font-[var(--serif)] text-3xl text-[var(--foreground)]">
                Main author subscription plan
            </h2>
            <p className="mt-3 text-[var(--muted)]">
                We already have backend endpoints for reading and updating the primary subscription
                plan. This page will become the first monetization form.
            </p>
        </section>
    )
}
