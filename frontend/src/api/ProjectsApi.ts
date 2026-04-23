import type {
    CreateProjectFolderInput,
    CreateProjectInput,
    ProjectBundleDto,
    ProjectDto,
    ProjectNodeDto,
    ProjectNodeListDto,
    UpdateProjectInput,
    UpdateProjectNodeInput,
} from "@shared/types/content"

import { downloadBlob } from "@/utils/download-blob"
import {
    deleteData,
    downloadData,
    getData,
    patchData,
    postData,
    uploadData,
} from "@/utils/api/http"

class ProjectsApi {
    async createMyProject(input: CreateProjectInput) {
        return postData<ProjectDto>("/me/projects", input)
    }

    async listMyProjects(status?: ProjectDto["status"]) {
        const response = await getData<{ projects: ProjectDto[] }>("/me/projects", {
            params: { status },
        })
        return response.projects
    }

    async updateMyProject(projectId: string, input: UpdateProjectInput) {
        return patchData<ProjectDto>(`/me/projects/${projectId}`, input)
    }

    async deleteMyProject(projectId: string) {
        await deleteData(`/me/projects/${projectId}`)
    }

    async listMyProjectNodes(projectId: string, parentId?: string | null) {
        return getData<ProjectNodeListDto>("/me/project-nodes", {
            params: { parentId: parentId || undefined, projectId },
        })
    }

    async createMyProjectFolder(projectId: string, input: CreateProjectFolderInput) {
        return postData<ProjectNodeDto>("/me/project-folders", {
            ...input,
            projectId,
        })
    }

    async updateMyProjectNode(projectId: string, nodeId: string, input: UpdateProjectNodeInput) {
        return patchData<ProjectNodeDto>(`/me/project-nodes/${nodeId}`, {
            ...input,
            projectId,
        })
    }

    async deleteMyProjectNode(projectId: string, nodeId: string) {
        await deleteData(`/me/project-nodes/${nodeId}`, {
            params: { projectId },
        })
    }

    async uploadMyProjectFile(projectId: string, file: File, parentId?: string | null) {
        return uploadData<ProjectNodeDto>(
            `/me/project-files/upload/${projectId}`,
            file,
            {
                headers: { "Content-Type": file.type || "application/octet-stream" },
                params: {
                    name: file.name,
                    parentId: parentId || undefined,
                },
            }
        )
    }

    async downloadMyProjectFile(projectId: string, nodeId: string, fileName: string) {
        const file = await downloadData(`/me/project-files/download/${projectId}/${nodeId}`)
        downloadBlob(file, fileName)
    }

    async getMyProjectBundle(projectId: string, folderId?: string | null) {
        return getData<ProjectBundleDto>("/me/project-bundle", {
            params: { folderId: folderId || undefined, projectId },
        })
    }

    async getAuthorProject(slug: string, projectId: string) {
        return getData<ProjectDto>(`/authors/${slug}/projects/${projectId}`)
    }

    async listAuthorProjectNodes(slug: string, projectId: string, parentId?: string | null) {
        return getData<ProjectNodeListDto>("/author-project-nodes", {
            params: { parentId: parentId || undefined, projectId, slug },
        })
    }

    async downloadAuthorProjectFile(
        slug: string,
        projectId: string,
        nodeId: string,
        fileName: string
    ) {
        const file = await downloadData(
            `/project-files/download/${slug}/${projectId}/${nodeId}`
        )
        downloadBlob(file, fileName)
    }

    async getAuthorProjectBundle(slug: string, projectId: string, folderId?: string | null) {
        return getData<ProjectBundleDto>("/author-project-bundle", {
            params: { folderId: folderId || undefined, projectId, slug },
        })
    }
}

export const projectsApi = new ProjectsApi()
