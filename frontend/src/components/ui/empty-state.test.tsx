import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test, vi } from "vitest"

import { EmptyState } from "@/components/ui/empty-state"

describe("EmptyState", () => {
    test("renders without action button when no action is provided", () => {
        render(<EmptyState description="Nothing here yet." title="Empty" />)

        expect(screen.getByText("Empty")).toBeInTheDocument()
        expect(screen.getByText("Nothing here yet.")).toBeInTheDocument()
        expect(screen.queryByRole("button")).not.toBeInTheDocument()
    })

    test("calls action handler", async () => {
        const onAction = vi.fn()
        render(
            <EmptyState
                action="Create"
                description="Nothing here yet."
                onAction={onAction}
                title="Empty"
            />,
        )

        await userEvent.click(screen.getByRole("button", { name: "Create" }))
        expect(onAction).toHaveBeenCalledTimes(1)
    })
})
