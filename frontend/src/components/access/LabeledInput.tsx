import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface LabeledInputProps {
    description?: string
    disabled?: boolean
    label: string
    onChange: (value: string) => void
    value: string
}

export function LabeledInput({ description, disabled, label, onChange, value }: LabeledInputProps) {
    return (
        <Label className="gap-1.5">
            {label}
            <Input
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
                value={value}
            />
            {description ? (
                <span className="text-xs leading-4 text-[var(--muted)]">{description}</span>
            ) : null}
        </Label>
    )
}
