import { Badge } from "@/components/ui/badge"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { authorFaq, authorHighlights } from "./author-content"

export function AuthorValuePanel() {
    return (
        <div className="relative overflow-hidden rounded-[36px] border border-[var(--line)] bg-[linear-gradient(145deg,rgba(88,183,255,0.18),rgba(9,24,44,0.72))] p-6 text-[var(--foreground)] shadow-[var(--shadow)] md:p-8">
            <div className="absolute -left-24 top-16 size-72 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="absolute -right-20 bottom-10 size-80 rounded-full bg-blue-600/20 blur-3xl" />

            <div className="relative">
                <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                    creator mode
                </div>
                <h1 className="mt-5 max-w-xl font-[var(--serif)] text-4xl leading-[1.05] md:text-6xl">
                    Build a paid content space around your wallet.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">
                    Launch an author profile, publish posts and projects, then decide who can open
                    each piece of content: everyone, token holders, NFT owners, or active
                    subscribers.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                    {authorHighlights.map((highlight) => (
                        <Badge className="rounded-full px-3 py-1" key={highlight}>
                            {highlight}
                        </Badge>
                    ))}
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    <Metric label="platform fee" value="20%" />
                    <Metric label="author share" value="80%" />
                    <Metric label="wallet mode" value="web3" />
                </div>

                <div className="mt-8">
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
