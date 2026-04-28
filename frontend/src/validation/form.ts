import type { z } from "zod"

export type FieldErrors = Record<string, string>

export type ValidationResult<TSchema extends z.ZodType> =
    | { data: z.output<TSchema>; fieldErrors: FieldErrors; success: true }
    | { fieldErrors: FieldErrors; success: false }

export function validateForm<TSchema extends z.ZodType>(
    schema: TSchema,
    values: unknown
): ValidationResult<TSchema> {
    const result = schema.safeParse(values)
    if (result.success) {
        return { data: result.data, fieldErrors: {}, success: true }
    }

    const fieldErrors: FieldErrors = {}
    for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "form")
        fieldErrors[key] ??= issue.message
    }

    return { fieldErrors, success: false }
}
