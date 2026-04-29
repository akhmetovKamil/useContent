let localIdCounter = 0

export function createLocalId(prefix = "local") {
    localIdCounter += 1
    return `${prefix}-${Date.now().toString(36)}-${localIdCounter.toString(36)}`
}

export function getOrCreateBrowserId(storageKey: string) {
    const existing = window.localStorage.getItem(storageKey)
    if (existing) {
        return existing
    }

    const next = window.crypto?.randomUUID?.() ?? createLocalId("browser")
    window.localStorage.setItem(storageKey, next)
    return next
}
