export function secret(name: string): () => string {
  return () => process.env[name] ?? "";
}
