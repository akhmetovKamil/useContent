import { defineConfig, devices } from "@playwright/test"

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173"
const isExternalTarget = Boolean(process.env.PLAYWRIGHT_BASE_URL)

export default defineConfig({
    expect: {
        timeout: 10_000,
    },
    fullyParallel: true,
    reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
    retries: process.env.CI ? 2 : 0,
    testDir: "./e2e",
    timeout: 30_000,
    use: {
        baseURL,
        trace: "retain-on-failure",
    },
    webServer: isExternalTarget
        ? undefined
        : {
              command: "npm run build && npm run preview -- --host 127.0.0.1 --port 4173",
              reuseExistingServer: !process.env.CI,
              timeout: 120_000,
              url: baseURL,
          },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
})
