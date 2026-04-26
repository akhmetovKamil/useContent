import type { ActivityDto } from "@shared/types/content"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, test, vi } from "vitest"

const activityMocks = vi.hoisted(() => ({
    useMyActivityQuery: vi.fn(),
}))

vi.mock("@/queries/activity", () => activityMocks)
vi.mock("@/stores/auth-store", () => ({
    useAuthStore: vi.fn(() => "token"),
}))

import { MeActivityPage } from "./MeActivityPage"

describe("MeActivityPage", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test("renders empty activity state", () => {
        activityMocks.useMyActivityQuery.mockReturnValue({
            data: { pages: [] },
            error: null,
            hasMore: false,
            isLoadingMore: false,
            items: [],
            isError: false,
            isLoading: false,
            loadMore: vi.fn(),
        })

        render(<MeActivityPage />, { wrapper: MemoryRouter })

        expect(screen.getByText("No activity yet")).toBeInTheDocument()
    })

    test("renders activity item with post link", () => {
        const activity: ActivityDto = {
            id: "activity-1",
            type: "post_commented",
            targetWallet: "0xabc",
            actorWallet: "0xdef",
            authorId: "author-1",
            authorSlug: "kamil",
            authorDisplayName: "Kamil",
            postId: "post-1",
            postTitle: "Hello",
            message: "0xdef commented on \"Hello\".",
            createdAt: "2026-04-24T10:00:00.000Z",
            readAt: null,
        }
        activityMocks.useMyActivityQuery.mockReturnValue({
            data: { pages: [{ items: [activity] }] },
            error: null,
            hasMore: false,
            isLoadingMore: false,
            items: [activity],
            isError: false,
            isLoading: false,
            loadMore: vi.fn(),
        })

        render(<MeActivityPage />, { wrapper: MemoryRouter })

        expect(screen.getByText("0xdef commented on \"Hello\".")).toBeInTheDocument()
        expect(screen.getByRole("link", { name: "Open post" })).toHaveAttribute(
            "href",
            "/authors/kamil/posts/post-1",
        )
    })
})
