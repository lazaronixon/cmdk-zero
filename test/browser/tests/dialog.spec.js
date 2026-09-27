// Ports cmdk/test/dialog.test.ts under its own title. Upstream's Dialog is
// Radix's, rendered in a portal with an overlay; here it is a native modal
// `<dialog>`, which renders in the top layer and draws its overlay as
// `::backdrop`.
import { expect, test } from "../test_helper.js"

test.describe("dialog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dialog.html?open")
  })

  test("dialog renders in portal", async ({ page, cmdk }) => {
    const dialog = page.locator("dialog")

    await expect(dialog).toHaveCount(1)
    await expect(dialog).toBeVisible()
    expect(await dialog.evaluate(element => element.matches(":modal"))).toBe(true)
    await expect(dialog.locator("cmdk-root")).toHaveCount(1)
    await expect(cmdk.items).toHaveCount(2)
  })
})

test.describe("cmdk-zero", () => {
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
})

test.describe("cmdk-zero, with groups that overflow the list", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dialog-groups.html")
  })

  // The list grows from 0px as the dialog opens, and keeping the first item in
  // view while it is still short must not leave its group's heading cut off.
  test("opens with the first group's heading in view", async ({ page, cmdk }) => {
    await page.getByTestId("open").click()
    await cmdk.expectSelected("Home")

    await expect.poll(() => cmdk.list.evaluate(list => list.style.getPropertyValue("--cmdk-list-height"))).not.toBe("0.0px")
    await page.waitForTimeout(300)

    expect(await cmdk.list.evaluate(list => list.scrollTop)).toBe(0)
    await expect(cmdk.group("Navigation").locator("cmdk-group-heading")).toBeInViewport()
  })
})
