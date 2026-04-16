export const env = {
    apiBaseUrl: import.meta.env.API_BASE_URL ?? "http://95.217.209.126:8080",
}

export function getFrontendRpcUrl(chainId: number): string | undefined {
    const value = import.meta.env[`RPC_URL_${chainId}`]

    return value && value !== "NONE" ? value : undefined
}
