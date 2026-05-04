import { ImagePlus } from "lucide-react"
import { useRef } from "react"

import { ProfileAvatar } from "@/components/common/ProfileAvatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ProfileAvatarPickerProps {
    avatarFileId?: string | null
    error?: string | null
    isPending?: boolean
    label: string
    onChange: (file: File) => void
}

export function ProfileAvatarPicker({
    avatarFileId,
    error,
    isPending,
    label,
    onChange,
}: ProfileAvatarPickerProps) {
    const inputRef = useRef<HTMLInputElement | null>(null)

    return (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <ProfileAvatar avatarFileId={avatarFileId} className="size-16" label={label} />
            <div className="grid gap-2">
                <div className="text-sm font-medium text-[var(--foreground)]">Avatar</div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        disabled={isPending}
                        onClick={() => inputRef.current?.click()}
                        type="button"
                        variant="outline"
                    >
                        <ImagePlus className="size-4" />
                        {isPending ? "Uploading..." : "Change avatar"}
                    </Button>
                    <Input
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (file) {
                                onChange(file)
                            }
                            event.target.value = ""
                        }}
                        ref={inputRef}
                        type="file"
                    />
                </div>
                {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            </div>
        </div>
    )
}
