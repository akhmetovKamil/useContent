import { QueryClientProvider } from "@tanstack/react-query"
import { createConfig, http, WagmiProvider } from "wagmi"
import {
    arbitrum,
    arbitrumSepolia,
    base,
    baseSepolia,
    optimism,
    optimismSepolia,
    sepolia,
} from "wagmi/chains"
import { injected } from "wagmi/connectors"

import { supportedChains } from "@/utils/config/chains"
import { getFrontendRpcUrl } from "@/utils/config/env"
import { AppToaster } from "@/components/app/AppToaster"
import { queryClient } from "./query-client"

const wagmiConfig = createConfig({
    chains: supportedChains,
    connectors: [injected()],
    transports: {
        [sepolia.id]: http(getFrontendRpcUrl(sepolia.id)),
        [baseSepolia.id]: http(getFrontendRpcUrl(baseSepolia.id)),
        [optimismSepolia.id]: http(getFrontendRpcUrl(optimismSepolia.id)),
        [arbitrumSepolia.id]: http(getFrontendRpcUrl(arbitrumSepolia.id)),
        [base.id]: http(getFrontendRpcUrl(base.id)),
        [optimism.id]: http(getFrontendRpcUrl(optimism.id)),
        [arbitrum.id]: http(getFrontendRpcUrl(arbitrum.id)),
    },
})

interface AppProvidersProps {
    children: React.ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                {children}
                <AppToaster />
            </QueryClientProvider>
        </WagmiProvider>
    )
}
