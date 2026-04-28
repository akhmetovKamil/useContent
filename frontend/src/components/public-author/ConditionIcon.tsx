import type { AccessPolicyConditionDto } from "@shared/types/content"
import { CheckCircle2, Gem, LockKeyhole, WalletCards } from "lucide-react"

export function ConditionIcon({ condition }: { condition: AccessPolicyConditionDto }) {
    if (condition.satisfied) {
        return <CheckCircle2 className="size-4 text-emerald-600" />
    }

    if (condition.type === "subscription") {
        return <WalletCards className="size-4 text-amber-600" />
    }

    if (condition.type === "nft_ownership") {
        return <Gem className="size-4 text-amber-600" />
    }

    return <LockKeyhole className="size-4 text-amber-600" />
}
