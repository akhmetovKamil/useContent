export interface GetNonceResponse {
    message: string
}

export interface VerifySignatureInput {
    address: string
    signature: string
}

export interface VerifySignatureResponse {
    token: string
}

