export function unwrapResponseKey<TResponse, TKey extends keyof TResponse>(
    response: TResponse,
    key: TKey
) {
    return response[key]
}
