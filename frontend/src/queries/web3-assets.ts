import { useQuery } from "@tanstack/react-query"

interface CoinGeckoSimplePriceResponse {
    [id: string]: {
        usd?: number
    }
}

export function useTokenUsdPriceQuery(coingeckoId?: string, enabled = true) {
    return useQuery({
        enabled: Boolean(coingeckoId) && enabled,
        queryFn: async () => {
            const response = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`
            )
            if (!response.ok) {
                throw new Error("price unavailable")
            }

            const data = (await response.json()) as CoinGeckoSimplePriceResponse
            return data[coingeckoId ?? ""]?.usd ?? null
        },
        queryKey: ["web3-token-price", coingeckoId],
        retry: 1,
        staleTime: 60_000,
    })
}
