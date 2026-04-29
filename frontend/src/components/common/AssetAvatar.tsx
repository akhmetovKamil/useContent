import { cn } from "@/utils/cn"

interface AssetAvatarProps {
    accent?: string
    className?: string
    imageUrl?: string
    label: string
    variant?: "circle" | "rounded"
}

export function AssetAvatar({
    accent,
    className,
    imageUrl,
    label,
    variant = "rounded",
}: AssetAvatarProps) {
    return (
        <span
            className={cn(
                "grid shrink-0 place-items-center overflow-hidden font-mono text-xs font-semibold text-white",
                variant === "circle" ? "h-11 w-11 rounded-full" : "size-12 rounded-2xl",
                accent ? `bg-gradient-to-br ${accent} shadow-lg` : "bg-white/20 ring-1 ring-white/30",
                className
            )}
        >
            {imageUrl ? <img alt="" className="size-full object-cover" src={imageUrl} /> : label}
        </span>
    )
}
