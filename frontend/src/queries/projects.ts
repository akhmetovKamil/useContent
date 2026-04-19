import type {
    CreateProjectFolderInput,
    CreateProjectInput,
    ProjectDto,
    UpdateProjectInput,
    UpdateProjectNodeInput,
} from "@contracts/types/content"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { authorsApi } from "@/api/AuthorsApi"
import { projectsApi } from "@/api/ProjectsApi"
import { queryKeys } from "./queryKeys"

export function useMyProjectsQuery(enabled = true, status?: ProjectDto["status"]) {
    return useQuery({
        queryKey: queryKeys.myProjects(status),
        queryFn: () => projectsApi.listMyProjects(status),
        enabled,
    })
}

export function useAuthorProjectsQuery(slug: string) {
    return useQuery({
        queryKey: queryKeys.authorProjects(slug),
        queryFn: () => authorsApi.listAuthorProjects(slug),
        enabled: Boolean(slug),
    })
}

export function useAuthorProjectQuery(slug: string, projectId: string) {
    return useQuery({
        queryKey: queryKeys.authorProject(slug, projectId),
        queryFn: () => projectsApi.getAuthorProject(slug, projectId),
        enabled: Boolean(slug) && Boolean(projectId),
    })
}

export function useMyProjectNodesQuery(
    projectId: string,
    parentId?: string | null,
    enabled = true
) {
    return useQuery({
        queryKey: queryKeys.myProjectNodes(projectId, parentId),
        queryFn: () => projectsApi.listMyProjectNodes(projectId, parentId),
        enabled: enabled && Boolean(projectId),
    })
}

export function useAuthorProjectNodesQuery(
    slug: string,
    projectId: string,
    parentId?: string | null,
    enabled = true
) {
    return useQuery({
        queryKey: queryKeys.authorProjectNodes(slug, projectId, parentId),
        queryFn: () => projectsApi.listAuthorProjectNodes(slug, projectId, parentId),
        enabled: enabled && Boolean(slug) && Boolean(projectId),
    })
}

export function useCreateMyProjectMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: CreateProjectInput) => projectsApi.createMyProject(input),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["me", "projects"] })
            void queryClient.invalidateQueries({ queryKey: ["authors"] })
        },
    })
}

export function useCreateMyProjectFolderMutation(projectId: string, parentId?: string | null) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: CreateProjectFolderInput) =>
            projectsApi.createMyProjectFolder(projectId, input),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.myProjectNodes(projectId, parentId),
            })
            void queryClient.invalidateQueries({ queryKey: ["me", "projects"] })
            void queryClient.invalidateQueries({ queryKey: ["authors"] })
        },
    })
}

export function useUploadMyProjectFileMutation(projectId: string, parentId?: string | null) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (file: File) => projectsApi.uploadMyProjectFile(projectId, file, parentId),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.myProjectNodes(projectId, parentId),
            })
            void queryClient.invalidateQueries({ queryKey: ["me", "projects"] })
            void queryClient.invalidateQueries({ queryKey: ["authors"] })
        },
    })
}

export function useUpdateMyProjectNodeMutation(projectId: string, parentId?: string | null) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ nodeId, input }: { nodeId: string; input: UpdateProjectNodeInput }) =>
            projectsApi.updateMyProjectNode(projectId, nodeId, input),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.myProjectNodes(projectId, parentId),
            })
            void queryClient.invalidateQueries({ queryKey: ["me", "projects"] })
            void queryClient.invalidateQueries({ queryKey: ["authors"] })
        },
    })
}

export function useDeleteMyProjectNodeMutation(projectId: string, parentId?: string | null) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (nodeId: string) => projectsApi.deleteMyProjectNode(projectId, nodeId),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.myProjectNodes(projectId, parentId),
            })
        },
    })
}

export function useDownloadMyProjectFileMutation(projectId: string) {
    return useMutation({
        mutationFn: ({ nodeId, fileName }: { nodeId: string; fileName: string }) =>
            projectsApi.downloadMyProjectFile(projectId, nodeId, fileName),
    })
}

export function useDownloadAuthorProjectFileMutation(slug: string, projectId: string) {
    return useMutation({
        mutationFn: ({ nodeId, fileName }: { nodeId: string; fileName: string }) =>
            projectsApi.downloadAuthorProjectFile(slug, projectId, nodeId, fileName),
    })
}

export function useUpdateMyProjectMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ projectId, input }: { projectId: string; input: UpdateProjectInput }) =>
            projectsApi.updateMyProject(projectId, input),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["me", "projects"] })
            void queryClient.invalidateQueries({ queryKey: ["authors"] })
        },
    })
}

export function useDeleteMyProjectMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (projectId: string) => projectsApi.deleteMyProject(projectId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["me", "projects"] })
            void queryClient.invalidateQueries({ queryKey: ["authors"] })
        },
    })
}
