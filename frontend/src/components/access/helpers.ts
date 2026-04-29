import { ruleTypeOptions } from "@/components/access/options"
import type { AccessRuleForm } from "@/utils/access-policy"
import { createLocalId } from "@/utils/local-id"

export function createRuleFromTemplate(rule: AccessRuleForm): AccessRuleForm {
    return {
        ...rule,
        id: createLocalId("rule"),
    }
}

export function getRuleTypeLabel(type: AccessRuleForm["type"]) {
    return ruleTypeOptions.find((option) => option.value === type)?.label ?? "Access rule"
}
