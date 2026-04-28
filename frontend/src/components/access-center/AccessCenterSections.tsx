import type { AccessPolicyPresetDto, SubscriptionPlanDto } from "@shared/types/content"
import { FileText, Plus, ShieldCheck, Sparkles } from "lucide-react"

import { FlowCard } from "@/components/access-center/FlowCard"
import { PolicyCard } from "@/components/access-center/PolicyCard"
import { SubscriptionPlanCard } from "@/components/access-center/SubscriptionPlanCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorMessage, LoadingMessage } from "@/components/ui/query-state"

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

interface PolicyListSectionProps {
    isError: boolean
    isLoading: boolean
    errorMessage?: string
    onCreate: () => void
    onDelete: (policyId: string) => void
    onEdit: (policy: AccessPolicyPresetDto) => void
    onMakeDefault: (policyId: string) => void
    policies: AccessPolicyPresetDto[]
}

export function PolicyListSection({
    isError,
    isLoading,
    errorMessage,
    onCreate,
    onDelete,
    onEdit,
    onMakeDefault,
    policies,
}: PolicyListSectionProps) {
    return (
        <Card className="overflow-hidden rounded-[34px]">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <CardTitle>Reusable policies</CardTitle>
                    <CardDescription>
                        These are the actual access tiers users see and content uses.
                    </CardDescription>
                </div>
                <Button className="rounded-full" onClick={onCreate} type="button">
                    <Plus className="size-4" />
                    Create policy
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <LoadingMessage>Loading policies...</LoadingMessage>
                ) : isError ? (
                    <ErrorMessage>{errorMessage ?? "Failed to load policies."}</ErrorMessage>
                ) : policies.length ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {policies.map((policy) => (
                            <PolicyCard
                                key={policy.id}
                                onDelete={() => onDelete(policy.id)}
                                onEdit={() => onEdit(policy)}
                                onMakeDefault={() => onMakeDefault(policy.id)}
                                policy={policy}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        action="Create first policy"
                        description="Create a policy before publishing private content. Public content can still be selected directly on posts and projects."
                        onAction={onCreate}
                        title="No access policies yet"
                    />
                )}
            </CardContent>
        </Card>
    )
}

interface SubscriptionPlanListSectionProps {
    deleteErrorMessage?: string
    isError: boolean
    isLoading: boolean
    errorMessage?: string
    onCreate: () => void
    onDelete: (planId: string) => void
    onEdit: (plan: SubscriptionPlanDto) => void
    plans: SubscriptionPlanDto[]
}

export function SubscriptionPlanListSection({
    deleteErrorMessage,
    isError,
    isLoading,
    errorMessage,
    onCreate,
    onDelete,
    onEdit,
    plans,
}: SubscriptionPlanListSectionProps) {
    return (
        <Card className="rounded-[34px]">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <CardTitle>Subscription building blocks</CardTitle>
                    <CardDescription>
                        Plans are hidden behind policies. Create them only when a policy needs paid
                        subscription access.
                    </CardDescription>
                </div>
                <Button className="rounded-full" onClick={onCreate} type="button" variant="outline">
                    <Plus className="size-4" />
                    Create plan
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <LoadingMessage>Loading plans...</LoadingMessage>
                ) : isError ? (
                    <ErrorMessage>{errorMessage ?? "Failed to load subscription plans."}</ErrorMessage>
                ) : plans.length ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {plans.map((plan) => (
                            <SubscriptionPlanCard
                                key={plan.id}
                                onDelete={() => onDelete(plan.id)}
                                onEdit={() => onEdit(plan)}
                                plan={plan}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        action="Create subscription plan"
                        description="You can also create a plan from inside a subscription condition."
                        onAction={onCreate}
                        title="No subscription plans yet"
                    />
                )}
                {deleteErrorMessage ? (
                    <div className="mt-3">
                        <ErrorMessage>{deleteErrorMessage}</ErrorMessage>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    )
}
