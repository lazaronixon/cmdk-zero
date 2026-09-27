// Ports cmdk/test/numeric.test.ts under its own titles.
import { expect, test } from "../test_helper.js"

test.describe("behavior for numeric values", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/numeric.html")
  })

  test("items filter correctly on numeric inputs", async ({ cmdk }) => {
    await cmdk.type("112")

    await expect(cmdk.item("removed")).toHaveCount(0)
    await expect(cmdk.item("foo.bar112.value")).toHaveCount(1)
  })

  test("items filter correctly on non-numeric inputs", async ({ cmdk }) => {
    await cmdk.type("bar")

    await expect(cmdk.item("removed")).toHaveCount(0)
    await expect(cmdk.item("foo.bar112.value")).toHaveCount(1)
  })
})
