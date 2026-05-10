import { fileURLToPath, URL } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { configDefaults, defineConfig } from "vitest/config"

// https://vite.dev/config/
export default defineConfig({
    envPrefix: ["API_BASE_URL", "RPC_URL_"],
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
            "@shared": fileURLToPath(new URL("../shared", import.meta.url)),
        },
    },
    test: {
        environment: "jsdom",
        exclude: [...configDefaults.exclude, "e2e/**"],
        globals: false,
        setupFiles: "./src/test/setup.ts",
    },
})
