import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, test } from "vitest"

import { MetricsGrid } from "@/components/common/MetricsGrid"

describe("MetricsGrid", () => {
    test("renders metric labels, values, descriptions, and links", () => {
        render(
            <MemoryRouter>
                <MetricsGrid
                    metrics={[
                        {
                            description: "Active readers",
                            label: "Subscribers",
                            to: "/me/subscribers",
                            value: "12",
                        },
                    ]}
                />
            </MemoryRouter>
        )

        expect(screen.getByText("Subscribers")).toBeInTheDocument()
        expect(screen.getByText("12")).toBeInTheDocument()
        expect(screen.getByText("Active readers")).toBeInTheDocument()
        expect(screen.getByRole("link")).toHaveAttribute("href", "/me/subscribers")
    })
})
