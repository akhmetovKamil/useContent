import { type FormEvent, useEffect, useState } from "react"

import type { AuthorProfileDto, CreateAuthorProfileInput } from "@contracts/types/content"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/utils/cn"
import { authorTags } from "./author-content"

interface AuthorProfileFormProps {
    author?: AuthorProfileDto | null
    className?: string
    error?: string | null
    isPending?: boolean
    mode: "create" | "update"
    onSubmit: (input: CreateAuthorProfileInput) => void
}

export function AuthorProfileForm({
    author,
    className,
    error,
    isPending,
    mode,
    onSubmit,
}: AuthorProfileFormProps) {
    const [displayName, setDisplayName] = useState(author?.displayName ?? "")
    const [slug, setSlug] = useState(author?.slug ?? "")
    const [bio, setBio] = useState(author?.bio ?? "")
    const [tags, setTags] = useState<string[]>(author?.tags ?? [])
    const [customTag, setCustomTag] = useState("")

    useEffect(() => {
        if (!author) {
            return
        }

        setDisplayName(author.displayName)
        setSlug(author.slug)
        setBio(author.bio)
        setTags(author.tags ?? [])
    }, [author])

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        onSubmit({
            slug,
            displayName,
            bio,
            tags,
        })
    }

    function toggleTag(tag: string) {
        setTags((current) =>
            current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]
        )
    }

    function addCustomTag() {
        const value = customTag.trim().toLowerCase()
        if (!value || tags.includes(value)) {
            setCustomTag("")
            return
        }
        setTags((current) => [...current, value].slice(0, 12))
        setCustomTag("")
    }

    return (
        <Card
            className={cn(
                "h-full overflow-hidden rounded-[36px] shadow-[var(--shadow)]",
                mode === "create"
                    ? "border-[var(--accent)] bg-[linear-gradient(145deg,var(--accent-soft),var(--surface)_48%,var(--popover))]"
                    : "",
                className
            )}
        >
            <CardHeader className="pb-3">
                <CardTitle>
                    {mode === "create" ? "Create author profile" : "Author settings"}
                </CardTitle>
                <CardDescription>
                    {mode === "create"
                        ? "This public profile unlocks your author workspace and publishing tools."
                        : "Keep your public author identity clear, searchable, and ready for subscribers."}
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(100%-6.5rem)] overflow-y-auto">
                <form className="grid gap-5" onSubmit={submit}>
                    <Label>
                        Display name
                        <Input
                            onChange={(event) => setDisplayName(event.target.value)}
                            placeholder="Kamil Akhmetov"
                            value={displayName}
                        />
                    </Label>

                    <Label>
                        Username
                        <Input
                            disabled={mode === "update"}
                            onChange={(event) => setSlug(event.target.value)}
                            placeholder="kamil"
                            value={slug}
                        />
                        <span className="mt-1 block text-xs text-[var(--muted)]">
                            Public URL: /authors/{slug || "username"}
                        </span>
                    </Label>

                    <Label>
                        Description
                        <Textarea
                            className="min-h-32"
                            onChange={(event) => setBio(event.target.value)}
                            placeholder="What do you create, teach, publish, or build?"
                            value={bio}
                        />
                    </Label>

                    <div className="grid gap-3">
                        <div>
                            <div className="text-sm font-medium text-[var(--foreground)]">Tags</div>
                            <p className="mt-1 text-xs text-[var(--muted)]">
                                Choose a few signals so subscribers understand your space faster.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {authorTags.map((tag) => (
                                <button
                                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                                        tags.includes(tag)
                                            ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]"
                                            : "border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--accent)]"
                                    }`}
                                    key={tag}
                                    onClick={() => toggleTag(tag)}
                                    type="button"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                onChange={(event) => setCustomTag(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault()
                                        addCustomTag()
                                    }
                                }}
                                placeholder="Add custom tag"
                                value={customTag}
                            />
                            <Button onClick={addCustomTag} type="button" variant="outline">
                                Add
                            </Button>
                        </div>
                        {tags.length ? (
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag) => (
                                    <Badge className="rounded-full" key={tag}>
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    {error ? <p className="text-sm text-rose-600">{error}</p> : null}

                    <Button className="h-12 rounded-full" disabled={isPending} type="submit">
                        {isPending
                            ? mode === "create"
                                ? "Creating..."
                                : "Saving..."
                            : mode === "create"
                              ? "Become an author"
                              : "Save settings"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
