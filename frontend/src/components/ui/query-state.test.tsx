import { render, screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import { ErrorMessage, LoadingMessage } from "@/components/ui/query-state"

describe("query state components", () => {
    test("renders default loading copy", () => {
        render(<LoadingMessage />)

        expect(screen.getByText("Loading...")).toBeInTheDocument()
    })

    test("renders custom error copy", () => {
        render(<ErrorMessage>Something failed</ErrorMessage>)

        expect(screen.getByText("Something failed")).toBeInTheDocument()
    })
})
