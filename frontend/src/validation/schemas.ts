import { POST_REPORT_REASON } from "@shared/consts"
import { z } from "zod"

const postReportReasons = [
    POST_REPORT_REASON.SPAM,
    POST_REPORT_REASON.SCAM,
    POST_REPORT_REASON.ILLEGAL_CONTENT,
    POST_REPORT_REASON.ABUSE,
    POST_REPORT_REASON.OTHER,
] as const

export function authorProfileSchema(mode: "create" | "update") {
    return z.object({
        bio: z.string().trim().max(500, "Description must be 500 characters or less."),
        displayName: z.string().trim().min(1, "Display name is required."),
        slug: z
            .string()
            .trim()
            .toLowerCase()
            .superRefine((value, context) => {
                if (mode === "create" && !/^[a-z0-9-]{3,50}$/.test(value)) {
                    context.addIssue({
                        code: "custom",
                        message: "Use 3-50 chars: a-z, 0-9, and hyphen.",
                    })
                }
            }),
        tags: z.array(z.string().trim().toLowerCase()).max(12, "Use 12 tags or fewer."),
        socialLinks: z
            .array(
                z.object({
                    label: z
                        .string()
                        .trim()
                        .min(1, "Social label is required.")
                        .max(32, "Social label must be 32 characters or less."),
                    url: z
                        .string()
                        .trim()
                        .url("Social URL must be valid.")
                        .refine(
                            (value) =>
                                value.startsWith("http://") || value.startsWith("https://"),
                            "Social URL must use http or https."
                        ),
                })
            )
            .max(6, "Use 6 social links or fewer.")
            .default([]),
    })
}

export const commentSchema = z.object({
    content: z
        .string()
        .trim()
        .min(1, "Comment cannot be empty.")
        .max(1000, "Comment must be 1000 characters or less."),
})

export const reportPostSchema = z.object({
    comment: z.string().trim().max(1000, "Report comment must be 1000 characters or less."),
    reason: z.enum(postReportReasons),
})
