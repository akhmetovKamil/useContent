import type { FeedPostDto } from "@shared/types/content"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, test, vi } from "vitest"

const queryMocks = vi.hoisted(() => ({
    useCreatePostCommentMutation: vi.fn(),
    useDownloadAuthorPostAttachmentMutation: vi.fn(),
    useDownloadMyPostAttachmentMutation: vi.fn(),
    usePostCommentsQuery: vi.fn(),
    useTogglePostLikeMutation: vi.fn(),
}))

vi.mock("@/queries/posts", () => queryMocks)
vi.mock("@/stores/auth-store", () => ({
    useAuthStore: vi.fn(() => null),
}))

import { PostFeed } from "@/components/posts/PostFeed"

describe("PostFeed", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        queryMocks.useCreatePostCommentMutation.mockReturnValue({
            isPending: false,
            mutateAsync: vi.fn(),
        })
        queryMocks.useDownloadAuthorPostAttachmentMutation.mockReturnValue({
            isPending: false,
            mutateAsync: vi.fn(),
        })
        queryMocks.useDownloadMyPostAttachmentMutation.mockReturnValue({
            isPending: false,
            mutateAsync: vi.fn(),
        })
        queryMocks.usePostCommentsQuery.mockReturnValue({
            data: [],
            isError: false,
            isLoading: false,
        })
        queryMocks.useTogglePostLikeMutation.mockReturnValue({
            isPending: false,
            mutateAsync: vi.fn(),
        })
    })

    test("renders empty label when there are no posts", () => {
        render(<PostFeed emptyLabel="No posts yet." posts={[]} />, {
            wrapper: MemoryRouter,
        })

        expect(screen.getByText("No posts yet.")).toBeInTheDocument()
    })

    test("hides locked content and shows access message", () => {
        const post: FeedPostDto = {
            id: "post-1",
            title: "Locked post",
            content: "Secret content",
            status: "published",
            policyMode: "custom",
            policy: {
                version: 1,
                root: { type: "subscription", authorId: "author-1", planId: "plan-1" },
            },
            accessPolicyId: "policy-1",
            accessLabel: "Silver tier",
            commentsPreview: [],
            feedReason: null,
            feedSource: "author",
            hasAccess: false,
            likedByMe: false,
            likesCount: 0,
            promotion: null,
            commentsCount: 0,
            viewsCount: 0,
            attachments: [],
            attachmentIds: [],
            linkedProjectIds: [],
            authorId: "author-1",
            authorSlug: "kamil",
            authorDisplayName: "Kamil",
            createdAt: "2026-04-01T00:00:00.000Z",
            publishedAt: "2026-04-01T00:00:00.000Z",
            updatedAt: "2026-04-01T00:00:00.000Z",
        }

        render(
            <PostFeed emptyLabel="Empty" posts={[post]} showAuthor />,
            {
                wrapper: MemoryRouter,
            },
        )

        expect(screen.getByText("Locked post")).toBeInTheDocument()
        expect(screen.queryByText("Secret content")).not.toBeInTheDocument()
        expect(
            screen.getByText(/Subscribe or satisfy the access conditions to read it/i),
        ).toBeInTheDocument()
        expect(screen.getAllByText("Silver tier")).toHaveLength(2)
    })
})
