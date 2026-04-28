import type {
    AccessPolicyBuilderState,
    AccessRuleForm,
} from "@/utils/access-policy"

export interface SubscriptionPlanOption {
    billingPeriodDays?: number
    chainId?: number
    code: string
    price?: string
    title: string
}

export interface AccessPolicyEditorProps {
    builder: AccessPolicyBuilderState
    disabled?: boolean
    onChange: (nextState: AccessPolicyBuilderState) => void
    onCreatePlan?: () => void
    subscriptionPlans?: SubscriptionPlanOption[]
}

export interface RuleEditorProps {
    disabled?: boolean
    onChange: (nextRule: AccessRuleForm) => void
    rule: AccessRuleForm
}
