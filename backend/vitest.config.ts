import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { defineConfig } from "vitest/config"

const cacheRuntimePlatform =
  process.platform === "darwin"
    ? process.arch === "arm64"
      ? "darwin/arm64"
      : "darwin/amd64"
    : process.platform === "linux"
      ? process.arch === "arm64"
        ? "linux/arm64"
        : "linux/amd64"
      : null
const runtimeCandidates = [
  cacheRuntimePlatform
    ? join(
        homedir(),
        "Library/Caches/encore/cache/bin/v1.53.7",
        cacheRuntimePlatform,
        "encore-runtime.node",
      )
    : null,
  "/opt/homebrew/Cellar/encore/1.53.7/libexec/runtimes/js/encore-runtime.node",
  "/usr/local/Cellar/encore/1.53.7/libexec/runtimes/js/encore-runtime.node",
].filter(Boolean) as string[]

if (!process.env.ENCORE_RUNTIME_LIB) {
  const encoreRuntimePath = runtimeCandidates.find((candidate) =>
    existsSync(candidate),
  )
  if (encoreRuntimePath) {
    process.env.ENCORE_RUNTIME_LIB = encoreRuntimePath
  }
}

export default defineConfig({
  test: {
    environment: "node",
  },
})
