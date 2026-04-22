import type { PolicyMode } from "@shared/types/access"
import type { ContentStatus, CreatePostInput } from "@shared/types/content"
import { useState } from "react"

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
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [status, setStatus] = useState<ContentStatus>("draft")
    const [policyMode, setPolicyMode] = useState<PolicyMode>("inherited")
    const [accessPolicyId, setAccessPolicyId] = useState("")
    const [linkedProjectIds, setLinkedProjectIds] = useState<string[]>([])
    const [files, setFiles] = useState<File[]>([])

    return (
        <Card className="rounded-[28px]">
            <CardHeader>
                <CardTitle>Create a new post</CardTitle>
            </CardHeader>
            <CardContent>
                <form
                    className="grid gap-4"
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
                            files
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
                    <Label>
                        Title
                        <Input onChange={(event) => setTitle(event.target.value)} value={title} />
                    </Label>

                    <Label>
                        Content
                        <Textarea
                            className="min-h-44"
                            onChange={(event) => setContent(event.target.value)}
                            value={content}
                        />
                    </Label>

                    <div className="grid gap-4 md:grid-cols-2">
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
                                    <SelectItem value="draft">draft</SelectItem>
                                    <SelectItem value="published">published</SelectItem>
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
                                    <SelectItem value="inherited">inherited</SelectItem>
                                    <SelectItem value="public">public</SelectItem>
                                    <SelectItem value="custom">custom</SelectItem>
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

                    <Label>
                        Attached project
                        <Select
                            onValueChange={(projectId) =>
                                setLinkedProjectIds((current) =>
                                    current.includes(projectId) ? current : [...current, projectId]
                                )
                            }
                            value=""
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Attach existing project" />
                            </SelectTrigger>
                            <SelectContent>
                                {projectOptions.map((project) => (
                                    <SelectItem key={project.id} value={project.id}>
                                        {project.title} ({project.status})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Label>

                    {linkedProjectIds.length ? (
                        <div className="flex flex-wrap gap-2">
                            {linkedProjectIds.map((projectId) => {
                                const project = projectOptions.find((item) => item.id === projectId)
                                return (
                                    <button
                                        key={projectId}
                                        onClick={() =>
                                            setLinkedProjectIds((current) =>
                                                current.filter((item) => item !== projectId)
                                            )
                                        }
                                        type="button"
                                    >
                                        <Badge className="rounded-full">
                                            {project?.title ?? projectId} x
                                        </Badge>
                                    </button>
                                )
                            })}
                        </div>
                    ) : null}

                    <Label>
                        Media attachments
                        <Input
                            accept="image/*,video/*,audio/*"
                            multiple
                            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
                            type="file"
                        />
                    </Label>

                    {files.length ? (
                        <div className="flex flex-wrap gap-2">
                            {files.map((file) => (
                                <Badge className="rounded-full" key={`${file.name}-${file.size}`}>
                                    {file.name}
                                </Badge>
                            ))}
                        </div>
                    ) : null}

                    {createError ? (
                        <p className="text-sm text-rose-600">{createError.message}</p>
                    ) : null}

                    <Button className="w-fit rounded-full" disabled={isPending} type="submit">
                        {isPending ? "Publishing..." : "Create post"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
