export const env = {
    apiBaseUrl: import.meta.env.API_BASE_URL ?? "https://api.usecontent.app",
}

export function getFrontendRpcUrl(chainId: number): string | undefined {
    const value = import.meta.env[`RPC_URL_${chainId}`]

    return value && value !== "NONE" ? value : undefined
}
