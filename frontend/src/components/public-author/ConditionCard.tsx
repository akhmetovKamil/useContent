import { ACCESS_POLICY_NODE_TYPE } from "@shared/consts"
import type { AccessPolicyConditionDto } from "@shared/types/access"

import { ConditionIcon } from "@/components/public-author/ConditionIcon"
import { SubscribeButton } from "@/components/subscriptions/SubscribeButton"
import { Badge } from "@/components/ui/badge"
import { NftConditionAssetCard } from "@/components/web3/NftConditionAssetCard"
import { TokenConditionAssetCard } from "@/components/web3/TokenConditionAssetCard"
import {
    formatAccessTierDate,
    getConditionDescription,
    getConditionTitle,
} from "@/utils/access-tier"

export function ConditionCard({
    authorSlug,
    condition,
}: {
    authorSlug: string
    condition: AccessPolicyConditionDto
}) {
    return (
        <article className="grid gap-4 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2 font-medium text-[var(--foreground)]">
                        <ConditionIcon condition={condition} />
                        {getConditionTitle(condition)}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        {getConditionDescription(condition)}
                    </p>
                </div>
                <Badge variant={condition.satisfied ? "success" : "warning"}>
                    {condition.satisfied ? "satisfied" : "missing"}
                </Badge>
            </div>

            {condition.type === ACCESS_POLICY_NODE_TYPE.SUBSCRIPTION ? (
                <div className="grid gap-3">
                    {condition.validUntil ? (
                        <p className="text-sm text-[var(--muted)]">
                            Active until {formatAccessTierDate(condition.validUntil)}
                        </p>
                    ) : null}
                    {!condition.satisfied ? (
                        <SubscribeButton
                            authorSlug={authorSlug}
                            label="Pay subscription"
                            plan={condition.plan}
                        />
                    ) : null}
                </div>
            ) : null}

            {condition.type === ACCESS_POLICY_NODE_TYPE.TOKEN_BALANCE ? (
                <TokenConditionAssetCard
                    chainId={condition.chainId}
                    contractAddress={condition.contractAddress}
                    currentBalance={condition.currentBalance}
                    decimals={condition.decimals}
                    minAmount={condition.minAmount}
                    satisfied={condition.satisfied}
                />
            ) : null}

            {condition.type === ACCESS_POLICY_NODE_TYPE.NFT_OWNERSHIP ? (
                <NftConditionAssetCard
                    chainId={condition.chainId}
                    contractAddress={condition.contractAddress}
                    currentBalance={condition.currentBalance}
                    minBalance={condition.minBalance}
                    satisfied={condition.satisfied}
                    standard={condition.standard}
                    tokenId={condition.tokenId}
                />
            ) : null}
        </article>
    )
}
