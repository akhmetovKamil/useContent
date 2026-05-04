import { CONTENT_STATUS, POLICY_MODE } from "@shared/consts"
import type { PolicyMode } from "@shared/types/access"
import type {
    ContentStatus,
    CreatePostInput,
    PostMediaGridLayoutDto,
    PostMediaLayout,
} from "@shared/types/posts"
import { FolderKanban, Images, ImagePlus, LayoutGrid, X } from "lucide-react"
import type { DragEvent } from "react"
import { useEffect, useMemo, useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
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
    const [status, setStatus] = useState<ContentStatus>(CONTENT_STATUS.DRAFT)
    const [policyMode, setPolicyMode] = useState<PolicyMode>(POLICY_MODE.INHERITED)
    const [accessPolicyId, setAccessPolicyId] = useState("")
    const [linkedProjectIds, setLinkedProjectIds] = useState<string[]>([])
    const [files, setFiles] = useState<File[]>([])
    const [mediaLayout, setMediaLayout] = useState<PostMediaLayout>("carousel")
    const [gridSizes, setGridSizes] = useState<number[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const selectedProjects = useMemo(
        () => projectOptions.filter((project) => linkedProjectIds.includes(project.id)),
        [linkedProjectIds, projectOptions]
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
        [files]
    )
    const canUseResizableGrid =
        mediaPreviews.length >= 2 &&
        mediaPreviews.length <= 4 &&
        mediaPreviews.every((preview) => preview.isImage)
    const effectiveMediaLayout = canUseResizableGrid ? mediaLayout : "carousel"
    const mediaGridLayout: PostMediaGridLayoutDto | null =
        effectiveMediaLayout === "resizable_grid"
            ? {
                  variant:
                      mediaPreviews.length === 2
                          ? "two"
                          : mediaPreviews.length === 3
                            ? "three"
                            : "four",
                  sizes: normalizeGridSizes(gridSizes, mediaPreviews.length),
              }
            : null

    useEffect(
        () => () => {
            mediaPreviews.forEach((preview) => URL.revokeObjectURL(preview.url))
        },
        [mediaPreviews]
    )

    useEffect(() => {
        if (!canUseResizableGrid && mediaLayout === "resizable_grid") {
            setMediaLayout("carousel")
        }
    }, [canUseResizableGrid, mediaLayout])

    useEffect(() => {
        setGridSizes((current) => normalizeGridSizes(current, mediaPreviews.length))
    }, [mediaPreviews.length])

    function addFiles(nextFiles: File[]) {
        setFiles((current) => {
            const existingKeys = new Set(current.map((file) => `${file.name}:${file.size}`))
            const unique = nextFiles.filter(
                (file) => !existingKeys.has(`${file.name}:${file.size}`)
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
                                accessPolicyId:
                                    policyMode === POLICY_MODE.CUSTOM ? accessPolicyId : null,
                                content,
                                linkedProjectIds,
                                mediaGridLayout,
                                mediaLayout: effectiveMediaLayout,
                                policyMode,
                                status,
                                title,
                            },
                            files
                        ).then(() => {
                            setTitle("")
                            setContent("")
                            setStatus(CONTENT_STATUS.DRAFT)
                            setPolicyMode(POLICY_MODE.INHERITED)
                            setAccessPolicyId("")
                            setLinkedProjectIds([])
                            setFiles([])
                            setMediaLayout("carousel")
                            setGridSizes([])
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
                                isDragging ? "border-[var(--accent)] bg-[var(--accent-soft)]" : ""
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
                                onChange={(event) => addFiles(Array.from(event.target.files ?? []))}
                                ref={fileInputRef}
                                type="file"
                            />
                        </div>

                        {mediaPreviews.length ? (
                            <div className="grid gap-3">
                                {mediaPreviews.length > 1 ? (
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="text-sm font-medium text-[var(--foreground)]">
                                            Media layout
                                        </div>
                                        <div className="flex rounded-full border border-[var(--line)] bg-[var(--surface)] p-1">
                                            <Button
                                                className="rounded-full"
                                                onClick={() => setMediaLayout("carousel")}
                                                size="sm"
                                                type="button"
                                                variant={
                                                    effectiveMediaLayout === "carousel"
                                                        ? "default"
                                                        : "ghost"
                                                }
                                            >
                                                <Images className="size-4" />
                                                Carousel
                                            </Button>
                                            {canUseResizableGrid ? (
                                                <Button
                                                    className="rounded-full"
                                                    onClick={() =>
                                                        setMediaLayout("resizable_grid")
                                                    }
                                                    size="sm"
                                                    type="button"
                                                    variant={
                                                        effectiveMediaLayout === "resizable_grid"
                                                            ? "default"
                                                            : "ghost"
                                                    }
                                                >
                                                    <LayoutGrid className="size-4" />
                                                    Grid
                                                </Button>
                                            ) : null}
                                        </div>
                                    </div>
                                ) : null}
                                {mediaPreviews.length > 1 &&
                                effectiveMediaLayout === "carousel" ? (
                                <Carousel className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
                                    <CarouselContent className="-ml-0">
                                        {mediaPreviews.map((preview) => (
                                            <CarouselItem
                                                className="pl-0"
                                                key={`${preview.file.name}-${preview.file.size}`}
                                            >
                                                <ComposerMediaPreview
                                                    onRemove={() =>
                                                        setFiles((current) =>
                                                            current.filter(
                                                                (item) => item !== preview.file
                                                            )
                                                        )
                                                    }
                                                    preview={preview}
                                                />
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    <CarouselPrevious className="left-3" />
                                    <CarouselNext className="right-3" />
                                </Carousel>
                                ) : mediaPreviews.length > 1 ? (
                                    <ComposerResizableGrid
                                        onLayout={setGridSizes}
                                        onRemove={(file) =>
                                            setFiles((current) =>
                                                current.filter((item) => item !== file)
                                            )
                                        }
                                        previews={mediaPreviews}
                                        sizes={mediaGridLayout?.sizes ?? []}
                                    />
                                ) : (
                                <ComposerMediaPreview
                                    onRemove={() => setFiles([])}
                                    preview={mediaPreviews[0]}
                                />
                                )}
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
                                        <SelectItem value={CONTENT_STATUS.DRAFT}>Draft</SelectItem>
                                        <SelectItem value={CONTENT_STATUS.PUBLISHED}>
                                            Published
                                        </SelectItem>
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
                                        <SelectItem value={POLICY_MODE.INHERITED}>
                                            Default policy
                                        </SelectItem>
                                        <SelectItem value={POLICY_MODE.PUBLIC}>Public</SelectItem>
                                        <SelectItem value={POLICY_MODE.CUSTOM}>
                                            Saved policy
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </Label>
                        </div>

                        {policyMode === POLICY_MODE.CUSTOM ? (
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
                                                        : "hover:border-[var(--accent)]"
                                                )}
                                                key={project.id}
                                                onClick={() =>
                                                    setLinkedProjectIds((current) =>
                                                        selected
                                                            ? current.filter(
                                                                  (item) => item !== project.id
                                                              )
                                                            : [...current, project.id]
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
                            {isPending
                                ? "Publishing..."
                                : status === CONTENT_STATUS.DRAFT
                                  ? "Save draft"
                                  : "Publish post"}
                        </Button>
                    </aside>
                </form>
            </CardContent>
        </Card>
    )
}

interface ComposerMediaPreviewProps {
    onRemove: () => void
    preview: {
        file: File
        isAudio: boolean
        isImage: boolean
        isVideo: boolean
        url: string
    }
}

function ComposerMediaPreview({ onRemove, preview }: ComposerMediaPreviewProps) {
    const { file, isAudio, isImage, isVideo, url } = preview

    return (
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
            {isImage ? (
                <img alt={file.name} className="h-72 w-full object-cover" src={url} />
            ) : isVideo ? (
                <video className="h-72 w-full object-cover" controls src={url} />
            ) : isAudio ? (
                <div className="grid h-72 place-items-center bg-[var(--accent-soft)] p-4">
                    <audio className="w-full" controls src={url} />
                </div>
            ) : null}
            <div className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-[var(--foreground)]">
                        {file.name}
                    </div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                        {file.type || "file"} · {formatFileSize(file.size)}
                    </div>
                </div>
                <Button
                    aria-label={`Remove ${file.name}`}
                    onClick={onRemove}
                    size="icon"
                    type="button"
                    variant="ghost"
                >
                    <X className="size-4" />
                </Button>
            </div>
        </div>
    )
}

interface ComposerResizableGridProps {
    onLayout: (sizes: number[]) => void
    onRemove: (file: File) => void
    previews: ComposerMediaPreviewProps["preview"][]
    sizes: number[]
}

function ComposerResizableGrid({
    onLayout,
    onRemove,
    previews,
    sizes,
}: ComposerResizableGridProps) {
    return (
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
            <ResizablePanelGroup
                className="min-h-80"
                defaultLayout={toResizableLayout(sizes)}
                direction="horizontal"
                onLayoutChanged={(nextLayout) =>
                    onLayout(
                        previews.map((_, index) =>
                            Math.round(nextLayout[`media-${index}`] ?? sizes[index] ?? 0)
                        )
                    )
                }
            >
                {previews.map((preview, index) => (
                    <FragmentedResizableMediaPanel
                        defaultSize={sizes[index]}
                        index={index}
                        key={`${preview.file.name}-${preview.file.size}`}
                        onRemove={() => onRemove(preview.file)}
                        preview={preview}
                        showHandle={index < previews.length - 1}
                    />
                ))}
            </ResizablePanelGroup>
        </div>
    )
}

interface FragmentedResizableMediaPanelProps {
    defaultSize: number
    index: number
    onRemove: () => void
    preview: ComposerMediaPreviewProps["preview"]
    showHandle: boolean
}

function FragmentedResizableMediaPanel({
    defaultSize,
    index,
    onRemove,
    preview,
    showHandle,
}: FragmentedResizableMediaPanelProps) {
    const panelId = `media-${index}`
    return (
        <>
            <ResizablePanel defaultSize={defaultSize} id={panelId} minSize={20}>
                <div className="relative h-full min-h-80">
                    <img
                        alt={preview.file.name}
                        className="h-full min-h-80 w-full object-cover"
                        src={preview.url}
                    />
                    <Button
                        aria-label={`Remove ${preview.file.name}`}
                        className="absolute top-3 right-3 rounded-full shadow-[var(--shadow)]"
                        onClick={onRemove}
                        size="icon"
                        type="button"
                        variant="secondary"
                    >
                        <X className="size-4" />
                    </Button>
                    <div className="absolute right-0 bottom-0 left-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.58))] p-3 text-white">
                        <div className="truncate text-sm font-medium">{preview.file.name}</div>
                        <div className="mt-1 text-xs text-white/75">
                            {formatFileSize(preview.file.size)}
                        </div>
                    </div>
                </div>
            </ResizablePanel>
            {showHandle ? <ResizableHandle withHandle /> : null}
        </>
    )
}

function normalizeGridSizes(sizes: number[], count: number) {
    if (count < 2 || count > 4) {
        return []
    }

    if (sizes.length === count) {
        return sizes.map((size) => Math.min(80, Math.max(20, Math.round(size))))
    }

    return Array.from({ length: count }, () => Math.round(100 / count))
}

function toResizableLayout(sizes: number[]) {
    return sizes.reduce<Record<string, number>>((layout, size, index) => {
        layout[`media-${index}`] = size
        return layout
    }, {})
}
