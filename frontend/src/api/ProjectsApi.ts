import type { CreateProjectInput, ProjectDto, UpdateProjectInput } from "@contracts/types/content"

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

    async getAuthorProject(slug: string, projectId: string) {
        const response = await http.get<ProjectDto>(`/authors/${slug}/projects/${projectId}`)
        return response.data
    }
}

export const projectsApi = new ProjectsApi()
