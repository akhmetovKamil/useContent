export const env = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://95.217.209.126:8080",
}

export function getFrontendRpcUrl(chainId: number): string | undefined {
    const value = import.meta.env[`VITE_RPC_URL_${chainId}`]

    return value && value !== "NONE" ? value : undefined
}

export function getSubscriptionManagerAddress(chainId: number): string | undefined {
    const value = import.meta.env[`VITE_SUBSCRIPTION_MANAGER_${chainId}`]

    return value && value !== "NONE" ? value : undefined
}
