import type { PolicyMode } from "@shared/types/access"
import type { ContentStatus, CreatePostInput } from "@shared/types/content"
import { FolderKanban, ImagePlus, X } from "lucide-react"
import type { DragEvent } from "react"
import { useEffect, useMemo, useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/utils/cn"
import { formatFileSize } from "@/utils/format"

interface SavedAccessPolicyOption {
    id: string
    isDefault: boolean
    name: string
}

interface ProjectOption {
    id: string
    title: string
    status: string
}

interface PostComposerProps {
    accessPolicies?: SavedAccessPolicyOption[]
    createError?: Error | null
    isPending: boolean
    projectOptions?: ProjectOption[]
    onSubmit: (input: CreatePostInput, files: File[]) => Promise<unknown>
}

export function PostComposer({
    accessPolicies = [],
    createError,
    isPending,
    onSubmit,
    projectOptions = [],
}: PostComposerProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [status, setStatus] = useState<ContentStatus>("draft")
    const [policyMode, setPolicyMode] = useState<PolicyMode>("inherited")
    const [accessPolicyId, setAccessPolicyId] = useState("")
    const [linkedProjectIds, setLinkedProjectIds] = useState<string[]>([])
    const [files, setFiles] = useState<File[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const selectedProjects = useMemo(
        () => projectOptions.filter((project) => linkedProjectIds.includes(project.id)),
        [linkedProjectIds, projectOptions],
    )
    const mediaPreviews = useMemo(
        () =>
            files.map((file) => ({
                file,
                isAudio: file.type.startsWith("audio/"),
                isImage: file.type.startsWith("image/"),
                isVideo: file.type.startsWith("video/"),
                url: URL.createObjectURL(file),
            })),
        [files],
    )

    useEffect(
        () => () => {
            mediaPreviews.forEach((preview) => URL.revokeObjectURL(preview.url))
        },
        [mediaPreviews],
    )

    function addFiles(nextFiles: File[]) {
        setFiles((current) => {
            const existingKeys = new Set(current.map((file) => `${file.name}:${file.size}`))
            const unique = nextFiles.filter(
                (file) => !existingKeys.has(`${file.name}:${file.size}`),
            )
            return [...current, ...unique]
        })
    }

    function handleDrop(event: DragEvent<HTMLDivElement>) {
        event.preventDefault()
        setIsDragging(false)
        addFiles(Array.from(event.dataTransfer.files ?? []))
    }

    return (
        <Card className="overflow-hidden rounded-2xl">
            <CardHeader className="border-b border-[var(--line)] bg-[var(--surface-strong)]">
                <CardTitle>Create a new post</CardTitle>
                <p className="text-sm text-[var(--muted)]">
                    Draft first or publish immediately with media and attached projects.
                </p>
            </CardHeader>
            <CardContent className="p-0">
                <form
                    className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]"
                    onSubmit={(event) => {
                        event.preventDefault()
                        void onSubmit(
                            {
                                accessPolicyId: policyMode === "custom" ? accessPolicyId : null,
                                content,
                                linkedProjectIds,
                                policyMode,
                                status,
                                title,
                            },
                            files,
                        ).then(() => {
                            setTitle("")
                            setContent("")
                            setStatus("draft")
                            setPolicyMode("inherited")
                            setAccessPolicyId("")
                            setLinkedProjectIds([])
                            setFiles([])
                        })
                    }}
                >
                    <div className="grid gap-4 p-5">
                        <Label>
                            Title
                            <Input
                                onChange={(event) => setTitle(event.target.value)}
                                placeholder="Short post title"
                                value={title}
                            />
                        </Label>

                        <Label>
                            Content
                            <Textarea
                                className="min-h-56"
                                onChange={(event) => setContent(event.target.value)}
                                placeholder="Write an update, lesson, project note, or media caption..."
                                value={content}
                            />
                        </Label>

                        <div
                            className={cn(
                                "grid cursor-pointer place-items-center rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface-strong)] p-6 text-center transition",
                                isDragging ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "",
                            )}
                            onClick={() => fileInputRef.current?.click()}
                            onDragLeave={() => setIsDragging(false)}
                            onDragOver={(event) => {
                                event.preventDefault()
                                setIsDragging(true)
                            }}
                            onDrop={handleDrop}
                        >
                            <ImagePlus className="size-7 text-[var(--muted)]" />
                            <div className="mt-3 font-medium text-[var(--foreground)]">
                                Drop media here or choose files
                            </div>
                            <p className="mt-1 text-sm text-[var(--muted)]">
                                Images, videos and audio files are supported.
                            </p>
                            <Input
                                accept="image/*,video/*,audio/*"
                                className="hidden"
                                multiple
                                onChange={(event) =>
                                    addFiles(Array.from(event.target.files ?? []))
                                }
                                ref={fileInputRef}
                                type="file"
                            />
                        </div>

                        {mediaPreviews.length ? (
                            <div className="grid gap-2 sm:grid-cols-2">
                                {mediaPreviews.map(({ file, isAudio, isImage, isVideo, url }) => (
                                    <div
                                        className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
                                        key={`${file.name}-${file.size}`}
                                    >
                                        {isImage ? (
                                            <img
                                                alt={file.name}
                                                className="h-36 w-full object-cover"
                                                src={url}
                                            />
                                        ) : isVideo ? (
                                            <video
                                                className="h-36 w-full object-cover"
                                                controls
                                                src={url}
                                            />
                                        ) : isAudio ? (
                                            <div className="grid h-36 place-items-center bg-[var(--accent-soft)] p-4">
                                                <audio className="w-full" controls src={url} />
                                            </div>
                                        ) : null}
                                        <div className="flex items-center justify-between gap-3 p-3">
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-medium text-[var(--foreground)]">
                                                    {file.name}
                                                </div>
                                                <div className="mt-1 text-xs text-[var(--muted)]">
                                                    {file.type || "file"} ·{" "}
                                                    {formatFileSize(file.size)}
                                                </div>
                                            </div>
                                            <Button
                                                aria-label={`Remove ${file.name}`}
                                                onClick={() =>
                                                    setFiles((current) =>
                                                        current.filter((item) => item !== file),
                                                    )
                                                }
                                                size="icon"
                                                type="button"
                                                variant="ghost"
                                            >
                                                <X className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    <aside className="grid gap-4 border-t border-[var(--line)] bg-[var(--surface-strong)] p-5 lg:border-t-0 lg:border-l">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                            <Label>
                                Status
                                <Select
                                    onValueChange={(value) => setStatus(value as ContentStatus)}
                                    value={status}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="published">Published</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Label>

                            <Label>
                                Access mode
                                <Select
                                    onValueChange={(value) => setPolicyMode(value as PolicyMode)}
                                    value={policyMode}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="inherited">Default policy</SelectItem>
                                        <SelectItem value="public">Public</SelectItem>
                                        <SelectItem value="custom">Saved policy</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Label>
                        </div>

                        {policyMode === "custom" ? (
                            <Label>
                                Saved access policy
                                <Select onValueChange={setAccessPolicyId} value={accessPolicyId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select policy" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {accessPolicies.map((policy) => (
                                            <SelectItem key={policy.id} value={policy.id}>
                                                {policy.name}
                                                {policy.isDefault ? " (default)" : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Label>
                        ) : null}

                        <div className="grid gap-3">
                            <div className="text-sm font-medium text-[var(--foreground)]">
                                Attached projects
                            </div>
                            {projectOptions.length ? (
                                <div className="grid gap-2">
                                    {projectOptions.map((project) => {
                                        const selected = linkedProjectIds.includes(project.id)
                                        return (
                                            <button
                                                className={cn(
                                                    "flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 text-left transition",
                                                    selected
                                                        ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                                                        : "hover:border-[var(--accent)]",
                                                )}
                                                key={project.id}
                                                onClick={() =>
                                                    setLinkedProjectIds((current) =>
                                                        selected
                                                            ? current.filter(
                                                                  (item) => item !== project.id,
                                                              )
                                                            : [...current, project.id],
                                                    )
                                                }
                                                type="button"
                                            >
                                                <span className="flex min-w-0 items-center gap-3">
                                                    <FolderKanban className="size-4 shrink-0 text-[var(--muted)]" />
                                                    <span className="min-w-0">
                                                        <span className="block truncate text-sm font-medium">
                                                            {project.title}
                                                        </span>
                                                        <span className="text-xs text-[var(--muted)]">
                                                            {project.status}
                                                        </span>
                                                    </span>
                                                </span>
                                                {selected ? <Badge>Selected</Badge> : null}
                                            </button>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-[var(--muted)]">
                                    Create a project to attach it to posts.
                                </p>
                            )}
                        </div>

                        {selectedProjects.length ? (
                            <p className="text-xs text-[var(--muted)]">
                                {selectedProjects.length} project
                                {selectedProjects.length === 1 ? "" : "s"} attached to this post.
                            </p>
                        ) : null}

                        {createError ? (
                            <p className="text-sm text-rose-600">{createError.message}</p>
                        ) : null}

                        <Button className="w-fit rounded-full" disabled={isPending} type="submit">
                            {isPending ? "Publishing..." : status === "draft" ? "Save draft" : "Publish post"}
                        </Button>
                    </aside>
                </form>
            </CardContent>
        </Card>
    )
}
