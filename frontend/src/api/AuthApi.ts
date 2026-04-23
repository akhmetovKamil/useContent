import type { GetNonceDto, VerifySignatureDto, VerifySignatureInput } from "@shared/types/auth"
import { getData, postData } from "@/utils/api/http"

class AuthApi {
    async getNonce(address: string) {
        return getData<GetNonceDto>("/auth/nonce", {
            params: { address },
        })
    }

    async verifySignature(input: VerifySignatureInput) {
        return postData<VerifySignatureDto>("/auth/verify", input)
    }
}

export const authApi = new AuthApi()
