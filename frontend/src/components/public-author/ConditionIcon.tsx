import { ACCESS_POLICY_NODE_TYPE } from "@shared/consts"
import type { AccessPolicyConditionDto } from "@shared/types/content"
import { CheckCircle2, Gem, LockKeyhole, WalletCards } from "lucide-react"

export function ConditionIcon({ condition }: { condition: AccessPolicyConditionDto }) {
    if (condition.satisfied) {
        return <CheckCircle2 className="size-4 text-emerald-600" />
    }

    if (condition.type === ACCESS_POLICY_NODE_TYPE.SUBSCRIPTION) {
        return <WalletCards className="size-4 text-amber-600" />
    }

    if (condition.type === ACCESS_POLICY_NODE_TYPE.NFT_OWNERSHIP) {
        return <Gem className="size-4 text-amber-600" />
    }

    return <LockKeyhole className="size-4 text-amber-600" />
}
