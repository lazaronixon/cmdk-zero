import { expect, test } from "../test_helper.js"

test.beforeEach(async ({ page }) => {
  await page.goto("/dialog.html")
})

test("stays closed until opened", async ({ page }) => {
  await expect(page.locator("dialog")).not.toBeVisible()
})

test("opens as a modal and focuses the search", async ({ page, cmdk }) => {
  await page.getByTestId("open").click()

  await expect(page.locator("dialog")).toBeVisible()
  await expect(cmdk.input).toBeFocused()
})

test("toggles with the keyboard shortcut", async ({ page, cmdk }) => {
  await page.keyboard.press("Control+k")
  await expect(cmdk.input).toBeFocused()

  await page.keyboard.press("Control+k")
  await expect(page.locator("dialog")).not.toBeVisible()
})

test("filters and navigates inside the dialog", async ({ page, cmdk }) => {
  await page.getByTestId("open").click()

  await cmdk.type("x")
  await cmdk.expectSelected("xxx")
  await expect(cmdk.item("Item")).toHaveCount(0)
})

test("closes on Escape", async ({ page }) => {
  await page.getByTestId("open").click()

  await page.keyboard.press("Escape")

  await expect(page.locator("dialog")).not.toBeVisible()
})

test("closes when an item is chosen", async ({ page, cmdk }) => {
  await page.getByTestId("open").click()

  await cmdk.press("Enter")

  await cmdk.expectEvents("select", [ "Item" ])
  await expect(page.locator("dialog")).not.toBeVisible()
})

test("draws the backdrop from the theme", async ({ page }) => {
  await page.getByTestId("open").click()

  const backdrop = await page.locator("dialog").evaluate(dialog => getComputedStyle(dialog, "::backdrop").backgroundColor)
  expect(backdrop).toBe("rgba(0, 0, 0, 0.3)")
})
