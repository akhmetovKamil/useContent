import { render, screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import { TokenLookupStateView } from "@/components/web3/pickers/TokenLookupStateView"

describe("TokenLookupStateView", () => {
    test("renders detected token metadata", () => {
        render(
            <TokenLookupStateView
                lookup={{
                    name: "USD Coin",
                    state: "success",
                    symbol: "USDC",
                }}
            />
        )

        expect(screen.getByText("Detected USD Coin (USDC).")).toBeInTheDocument()
    })
})
