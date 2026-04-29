import type { AccessPolicyPresetDto } from "@shared/types/access"
import { Plus } from "lucide-react"

import { PolicyCard } from "@/components/access-center/PolicyCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorMessage, LoadingMessage } from "@/components/ui/query-state"

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
