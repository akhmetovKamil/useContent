import axios from "axios"

export function isApiNotFoundError(error: unknown) {
    return axios.isAxiosError(error) && error.response?.status === 404
}
