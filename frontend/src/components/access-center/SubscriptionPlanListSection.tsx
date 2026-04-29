import type { SubscriptionPlanDto } from "@shared/types/subscriptions"
import { Plus } from "lucide-react"

import { SubscriptionPlanCard } from "@/components/access-center/SubscriptionPlanCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorMessage, LoadingMessage } from "@/components/ui/query-state"

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
