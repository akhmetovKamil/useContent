import type { GetNonceDto, VerifySignatureDto, VerifySignatureInput } from "@shared/types/auth"
import { http } from "@/utils/api/http"

class AuthApi {
    async getNonce(address: string) {
        const response = await http.get<GetNonceDto>("/auth/nonce", {
            params: { address },
        })

        return response.data
    }

    async verifySignature(input: VerifySignatureInput) {
        const response = await http.post<VerifySignatureDto>("/auth/verify", input)
        return response.data
    }
}

export const authApi = new AuthApi()
