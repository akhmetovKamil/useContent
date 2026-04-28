import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AddressInputProps {
    description?: string
    label: string
    onChange: (value: string) => void
    placeholder?: string
    value: string
}

export function AddressInput({
    description,
    label,
    onChange,
    placeholder,
    value,
}: AddressInputProps) {
    return (
        <Label>
            {label}
            <div className="relative mt-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--muted)]" />
                <Input
                    className="font-mono pl-10"
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder ?? "0x..."}
                    value={value}
                />
            </div>
            {description ? (
                <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                    {description}
                </span>
            ) : null}
        </Label>
    )
}
