import { FileText, ShieldCheck, Sparkles } from "lucide-react"

import { FlowCard } from "@/components/access-center/FlowCard"

export function AccessCenterFlow() {
    return (
        <div className="grid gap-4 lg:grid-cols-3">
            <FlowCard
                description="Create one rule set for a content tier."
                icon={<ShieldCheck className="size-5" />}
                title="1. Define policy"
            />
            <FlowCard
                description="Add subscription, token balance, or NFT ownership conditions."
                icon={<Sparkles className="size-5" />}
                title="2. Compose conditions"
            />
            <FlowCard
                description="Pick the policy when publishing posts or projects."
                icon={<FileText className="size-5" />}
                title="3. Attach to content"
            />
        </div>
    )
}
