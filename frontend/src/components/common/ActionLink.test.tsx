import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, test } from "vitest"

import { ActionLink } from "@/components/common/ActionLink"

describe("ActionLink", () => {
    test("renders a router link with the provided target", () => {
        render(
            <MemoryRouter>
                <ActionLink label="Open profile" to="/me/profile" />
            </MemoryRouter>
        )

        expect(screen.getByRole("link", { name: "Open profile" })).toHaveAttribute(
            "href",
            "/me/profile"
        )
    })
})
