import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/utils/cn"
import { env } from "@/utils/config/env"

interface ProfileAvatarProps {
    avatarFileId?: string | null
    className?: string
    fallbackClassName?: string
    label: string
}

export function ProfileAvatar({
    avatarFileId,
    className,
    fallbackClassName,
    label,
}: ProfileAvatarProps) {
    const fallback = getInitials(label)

    return (
        <Avatar className={className}>
            {avatarFileId ? (
                <AvatarImage
                    alt={label}
                    src={`${env.apiBaseUrl}/profile-avatars/${avatarFileId}`}
                />
            ) : null}
            <AvatarFallback className={cn("uppercase", fallbackClassName)}>
                {fallback}
            </AvatarFallback>
        </Avatar>
    )
}

export function getInitials(label: string) {
    const parts = label
        .replace(/^@/, "")
        .split(/[\s._-]+/)
        .map((part) => part.trim())
        .filter(Boolean)

    if (!parts.length) {
        return "UC"
    }

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase()
    }

    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}
