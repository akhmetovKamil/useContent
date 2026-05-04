import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test, vi } from "vitest"

import { AuthorProfileForm } from "@/components/author-onboarding/AuthorProfileForm"

describe("AuthorProfileForm", () => {
    test("renders create mode submit label", () => {
        render(<AuthorProfileForm mode="create" onSubmit={vi.fn()} />)

        expect(
            screen.getByRole("button", { name: "Become an author" }),
        ).toBeInTheDocument()
    })

    test("shows validation error when display name is missing", async () => {
        const onSubmit = vi.fn()
        render(<AuthorProfileForm mode="create" onSubmit={onSubmit} />)

        await userEvent.type(screen.getByLabelText("Username"), "kamil")
        await userEvent.click(
            screen.getByRole("button", { name: "Become an author" }),
        )

        expect(
            screen.getByText("Display name is required."),
        ).toBeInTheDocument()
        expect(onSubmit).not.toHaveBeenCalled()
    })

    test("shows slug validation error in create mode", async () => {
        render(<AuthorProfileForm mode="create" onSubmit={vi.fn()} />)

        await userEvent.type(screen.getByLabelText("Display name"), "Kamil")
        await userEvent.type(screen.getByLabelText("Username"), "??")
        await userEvent.click(
            screen.getByRole("button", { name: "Become an author" }),
        )

        expect(
            screen.getByText("Use 3-50 chars: a-z, 0-9, and hyphen."),
        ).toBeInTheDocument()
    })

    test("shows bio length validation error", async () => {
        render(<AuthorProfileForm mode="create" onSubmit={vi.fn()} />)

        await userEvent.type(screen.getByLabelText("Display name"), "Kamil")
        await userEvent.type(screen.getByLabelText("Username"), "kamil")
        fireEvent.change(screen.getByLabelText("Description"), {
            target: { value: "a".repeat(501) },
        })
        await userEvent.click(
            screen.getByRole("button", { name: "Become an author" }),
        )

        expect(
            screen.getByText("Description must be 500 characters or less."),
        ).toBeInTheDocument()
    })

    test("adds custom tag and submits normalized values", async () => {
        const onSubmit = vi.fn()
        render(<AuthorProfileForm mode="create" onSubmit={onSubmit} />)

        await userEvent.type(screen.getByLabelText("Display name"), " Kamil ")
        await userEvent.type(screen.getByLabelText("Username"), " Kamil-23 ")
        await userEvent.type(screen.getByPlaceholderText("Add custom tag"), "Security")
        await userEvent.click(screen.getByRole("button", { name: "Add" }))
        await userEvent.click(
            screen.getByRole("button", { name: "Become an author" }),
        )

        expect(screen.getByRole("button", { name: "security" })).toBeInTheDocument()
        expect(onSubmit).toHaveBeenCalledWith({
            slug: "kamil-23",
            displayName: "Kamil",
            bio: "",
            tags: ["security"],
            socialLinks: [],
        })
    })

    test("disables username in update mode and shows slug api error", () => {
        render(
            <AuthorProfileForm
                error="author slug already exists"
                mode="update"
                onSubmit={vi.fn()}
            />,
        )

        expect(screen.getByPlaceholderText("kamil")).toBeDisabled()
        expect(
            screen.getByText("author slug already exists"),
        ).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Save settings" })).toBeInTheDocument()
    })
})
