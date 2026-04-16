import { http } from "@/lib/api/http"
import type { GetNonceResponse, VerifySignatureInput, VerifySignatureResponse } from "@/types/auth"

class AuthApi {
    async getNonce(address: string) {
        const response = await http.get<GetNonceResponse>("/auth/nonce", {
            params: { address },
        })

        return response.data
    }

    async verifySignature(input: VerifySignatureInput) {
        const response = await http.post<VerifySignatureResponse>("/auth/verify", input)
        return response.data
    }
}

export const authApi = new AuthApi()
