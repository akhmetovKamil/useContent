import { describe, expect, test } from "vitest"

import { validateForm } from "@/validation/form"
import { authorProfileSchema, commentSchema, reportPostSchema } from "@/validation/schemas"

describe("form validation schemas", () => {
    test("normalizes author profile values", () => {
        const result = validateForm(authorProfileSchema("create"), {
            bio: " hello ",
            displayName: " Kamil ",
            slug: " KAMIL-23 ",
            tags: ["Crypto"],
        })

        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data).toEqual({
                bio: "hello",
                displayName: "Kamil",
                socialLinks: [],
                slug: "kamil-23",
                tags: ["crypto"],
            })
        }
    })

    test("returns field errors for invalid author profile", () => {
        const result = validateForm(authorProfileSchema("create"), {
            bio: "",
            displayName: "",
            slug: "??",
            tags: [],
        })

        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.fieldErrors.displayName).toBe("Display name is required.")
            expect(result.fieldErrors.slug).toBe("Use 3-50 chars: a-z, 0-9, and hyphen.")
        }
    })

    test("validates comments and reports", () => {
        expect(validateForm(commentSchema, { content: "" }).success).toBe(false)
        expect(validateForm(commentSchema, { content: "Nice post" }).success).toBe(true)
        expect(
            validateForm(reportPostSchema, { comment: "Looks suspicious", reason: "scam" }).success
        ).toBe(true)
    })
})
