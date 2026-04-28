import { v4 as uuidv4 } from "uuid"

import { ruleTypeOptions } from "@/components/access/options"
import type { AccessRuleForm } from "@/utils/access-policy"

export function createRuleFromTemplate(rule: AccessRuleForm): AccessRuleForm {
    return {
        ...rule,
        id: uuidv4(),
    }
}

export function getRuleTypeLabel(type: AccessRuleForm["type"]) {
    return ruleTypeOptions.find((option) => option.value === type)?.label ?? "Access rule"
}
