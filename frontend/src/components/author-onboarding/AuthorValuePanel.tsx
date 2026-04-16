import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { authorFaq } from "./author-content"

export function AuthorValuePanel() {
    return (
        <div className="relative h-full overflow-hidden rounded-[36px] border border-[var(--line)] bg-[linear-gradient(145deg,var(--surface),var(--popover))] p-5 text-[var(--foreground)] shadow-[var(--shadow)] md:p-7">
            <div className="absolute -left-24 top-16 size-72 rounded-full bg-[var(--accent-soft)] blur-3xl" />
            <div className="absolute -right-20 bottom-10 size-80 rounded-full bg-[var(--muted-background)] opacity-70 blur-3xl" />

            <div className="relative h-full overflow-y-auto pr-1">
                <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                    creator mode
                </div>
                <h1 className="mt-4 max-w-xl font-[var(--serif)] text-3xl leading-[1.08] md:text-5xl">
                    Build a paid content space around your wallet.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)] md:text-base">
                    Launch an author profile, publish posts and projects, then decide who can open
                    each piece of content: everyone, token holders, NFT owners, or active
                    subscribers.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <Metric label="platform fee" value="20%" />
                    <Metric label="author share" value="80%" />
                    <Metric label="wallet mode" value="web3" />
                </div>

                <div className="mt-6">
                    <div className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                        author faq
                    </div>
                    <Accordion>
                        {authorFaq.map((item) => (
                            <AccordionItem key={item.question}>
                                <AccordionTrigger>{item.question}</AccordionTrigger>
                                <AccordionContent>{item.answer}</AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </div>
    )
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="text-3xl font-medium text-[var(--foreground)]">{value}</div>
            <div className="mt-1 text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                {label}
            </div>
        </div>
    )
}
