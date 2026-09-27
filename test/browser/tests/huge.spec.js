import { expect, test } from "../test_helper.js"

test.beforeEach(async ({ page }) => {
  await page.goto("/huge.html")
})

test("upgrades with thousands of items and selects the first", async ({ cmdk }) => {
  await expect(cmdk.items).toHaveCount(3000)
  await cmdk.expectSelected("Item 0-0")
})

test("filters thousands of items", async ({ cmdk }) => {
  await cmdk.type("29-99")

  await cmdk.expectSelected("Item 29-99")
  await expect(cmdk.items.first()).toHaveAttribute("data-value", "Item 29-99")
})
