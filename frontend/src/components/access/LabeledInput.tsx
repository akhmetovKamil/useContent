import { Field } from "@/components/forms/Field"
import { Input } from "@/components/ui/input"

interface LabeledInputProps {
    description?: string
    disabled?: boolean
    label: string
    onChange: (value: string) => void
    value: string
}

export function LabeledInput({ description, disabled, label, onChange, value }: LabeledInputProps) {
    return (
        <Field description={description} label={label}>
            <Input
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
                value={value}
            />
        </Field>
    )
}
