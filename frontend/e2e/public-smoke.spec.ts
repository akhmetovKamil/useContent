import { expect, test } from "@playwright/test"

test("homepage shell loads", async ({ page }) => {
    await page.goto("/")

    await expect(page.getByTestId("app-shell")).toBeVisible()
    await expect(page.getByText("Unexpected Application Error")).toHaveCount(0)
    await expect(
        page.getByRole("heading", {
            name: "Content, access rules, and subscriptions in one place.",
        }),
    ).toBeVisible()
})

test("public discovery feed renders a stable state", async ({ page }) => {
    await page.goto("/")

    await expect(page.getByTestId("public-feed")).toBeVisible()
    await expect(page.getByText("Latest posts")).toBeVisible()

    const cards = page.getByTestId("post-card")
    const emptyState = page.getByTestId("empty-state")
    const errorState = page.getByTestId("public-feed-error")
    await expect
        .poll(
            async () => (await cards.count()) + (await emptyState.count()) + (await errorState.count()),
            {
                message: "public feed should settle into cards, empty state, or error state",
                timeout: 15_000,
            },
        )
        .toBeGreaterThan(0)

    if ((await cards.count()) > 0) {
        await expect(cards.first()).toBeVisible()
    } else if ((await emptyState.count()) > 0) {
        await expect(emptyState.first()).toBeVisible()
    } else {
        await expect(errorState.first()).toBeVisible()
    }
})

test("media lightbox opens when public media exists", async ({ page }) => {
    await page.goto("/")

    const mediaTiles = page.getByTestId("post-media-tile")
    const mediaCount = await mediaTiles.count()

    test.skip(mediaCount === 0, "No public media is available in this environment.")

    await mediaTiles.first().click()
    await expect(page.getByTestId("post-media-lightbox")).toBeVisible()
    await expect(page.getByRole("button", { name: "Download" })).toBeVisible()

    await page.keyboard.press("Escape")
    await expect(page.getByTestId("post-media-lightbox")).toHaveCount(0)
})
