import type {
    CreateProjectFolderInput,
    CreateProjectInput,
    ProjectDto,
    ProjectNodeDto,
    ProjectNodeListDto,
    UpdateProjectInput,
    UpdateProjectNodeInput,
} from "@contracts/types/content"

import { http } from "@/utils/api/http"

class ProjectsApi {
    async createMyProject(input: CreateProjectInput) {
        const response = await http.post<ProjectDto>("/me/projects", input)
        return response.data
    }

    async listMyProjects() {
        const response = await http.get<{ projects: ProjectDto[] }>("/me/projects")
        return response.data.projects
    }

    async updateMyProject(projectId: string, input: UpdateProjectInput) {
        const response = await http.patch<ProjectDto>(`/me/projects/${projectId}`, input)
        return response.data
    }

    async deleteMyProject(projectId: string) {
        await http.delete(`/me/projects/${projectId}`)
    }

    async listMyProjectNodes(projectId: string, parentId?: string | null) {
        const response = await http.get<ProjectNodeListDto>(`/me/projects/${projectId}/nodes`, {
            params: { parentId: parentId || undefined },
        })
        return response.data
    }

    async createMyProjectFolder(projectId: string, input: CreateProjectFolderInput) {
        const response = await http.post<ProjectNodeDto>(`/me/projects/${projectId}/folders`, input)
        return response.data
    }

    async updateMyProjectNode(projectId: string, nodeId: string, input: UpdateProjectNodeInput) {
        const response = await http.patch<ProjectNodeDto>(
            `/me/projects/${projectId}/nodes/${nodeId}`,
            input
        )
        return response.data
    }

    async deleteMyProjectNode(projectId: string, nodeId: string) {
        await http.delete(`/me/projects/${projectId}/nodes/${nodeId}`)
    }

    async uploadMyProjectFile(projectId: string, file: File, parentId?: string | null) {
        const response = await http.post<ProjectNodeDto>(
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
        return response.data
    }

    async downloadMyProjectFile(projectId: string, nodeId: string, fileName: string) {
        const response = await http.get<Blob>(`/me/project-files/download/${projectId}/${nodeId}`, {
            responseType: "blob",
        })
        downloadBlob(response.data, fileName)
    }

    async getAuthorProject(slug: string, projectId: string) {
        const response = await http.get<ProjectDto>(`/authors/${slug}/projects/${projectId}`)
        return response.data
    }

    async listAuthorProjectNodes(slug: string, projectId: string, parentId?: string | null) {
        const response = await http.get<ProjectNodeListDto>(
            `/authors/${slug}/projects/${projectId}/nodes`,
            {
                params: { parentId: parentId || undefined },
            }
        )
        return response.data
    }

    async downloadAuthorProjectFile(
        slug: string,
        projectId: string,
        nodeId: string,
        fileName: string
    ) {
        const response = await http.get<Blob>(
            `/project-files/download/${slug}/${projectId}/${nodeId}`,
            {
                responseType: "blob",
            }
        )
        downloadBlob(response.data, fileName)
    }
}

export const projectsApi = new ProjectsApi()

function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}
