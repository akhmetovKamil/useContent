export function formatFileSize(size: number) {
    if (!Number.isFinite(size) || size <= 0) {
        return "0 B"
    }

    const units = ["B", "KB", "MB", "GB", "TB"]
    let value = size
    let unitIndex = 0

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024
        unitIndex += 1
    }

    const digits = value >= 10 || unitIndex === 0 ? 0 : 1
    return `${value.toFixed(digits)} ${units[unitIndex]}`
}

export function formatUsdCents(cents: number) {
    return new Intl.NumberFormat("en-US", {
        currency: "USD",
        style: "currency",
    }).format(cents / 100)
}

export function formatUsdAmount(value: number | null | undefined) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return null
    }

    return new Intl.NumberFormat("en", {
        currency: "USD",
        maximumFractionDigits: value >= 1 ? 2 : 6,
        style: "currency",
    }).format(value)
}
