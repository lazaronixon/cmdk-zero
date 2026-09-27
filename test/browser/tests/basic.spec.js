// Ports cmdk/test/basic.test.ts under its own titles; the tests cmdk-zero adds
// on top of it live in the "cmdk-zero" block at the end.
import { expect, test } from "../test_helper.js"

test.beforeEach(async ({ page }) => {
  await page.goto("/basic.html")
})

test.describe("basic behavior", () => {
  test("input props are forwarded", async ({ page }) => {
    await expect(page.locator("input[placeholder=\"Search…\"]")).toHaveCount(1)
  })

  test("item value is derived from textContent", async ({ cmdk }) => {
    await expect(cmdk.item("Item")).toHaveText("Item")
  })

  test("item value prop is preferred over textContent", async ({ cmdk }) => {
    await expect(cmdk.item("xxx")).toHaveText("Value")
  })

  test("item onSelect is called on click", async ({ cmdk }) => {
    await cmdk.item("Item").click()

    await cmdk.expectEvents("select", [ "Item" ])
  })

  test("first item is selected by default", async ({ cmdk }) => {
    await expect(cmdk.selected).toHaveText("Item")
  })

  test("first item is selected when search changes", async ({ cmdk }) => {
    await cmdk.type("x")

    await expect(cmdk.selected).toHaveText("Value")
  })

  test("items filter when searching", async ({ cmdk }) => {
    await cmdk.type("x")

    await expect(cmdk.item("Item")).toHaveCount(0)
    await expect(cmdk.item("xxx")).toHaveCount(1)
  })

  test("items filter when searching by keywords", async ({ cmdk }) => {
    await cmdk.type("key")

    await expect(cmdk.item("xxx")).toHaveCount(0)
    await expect(cmdk.item("Item")).toHaveCount(1)
  })

  test("empty component renders when there are no results", async ({ cmdk }) => {
    await expect(cmdk.empty).toHaveCount(0)

    await cmdk.type("z")

    await expect(cmdk.items).toHaveCount(0)
    await expect(cmdk.empty).toHaveText("No results.")
  })

  // Upstream's parts unmount, so it counts the classes going away. Here a part
  // that does not match is hidden, not removed, so the count is of visible ones.
  test("className is applied to each part", async ({ page, cmdk }) => {
    await expect(page.locator(".root")).toHaveCount(1)
    await expect(page.locator(".input")).toHaveCount(1)
    await expect(page.locator(".list")).toHaveCount(1)
    await expect(page.locator(".item:visible")).toHaveCount(2)

    await cmdk.type("zzzz")

    await expect(page.locator(".item:visible")).toHaveCount(0)
    await expect(page.locator(".empty:visible")).toHaveCount(1)
  })
})

test.describe("cmdk-zero", () => {
  test("fires cmdk:select for Enter", async ({ cmdk }) => {
    await cmdk.input.focus()
    await cmdk.press("Enter")

    await cmdk.expectEvents("select", [ "Item" ])
  })

  test("selects an item under the pointer", async ({ cmdk }) => {
    await cmdk.item("xxx").hover()

    await cmdk.expectSelected("xxx")
  })

  test("fires cmdk:search and cmdk:change as the search narrows", async ({ cmdk }) => {
    await cmdk.type("x")

    await cmdk.expectEvents("search", [ "x" ])
    await cmdk.expectEvents("change", [ "xxx" ])
  })

  test("points the combobox at the selected option", async ({ cmdk }) => {
    const id = await cmdk.selected.getAttribute("id")

    await expect(cmdk.input).toHaveAttribute("aria-activedescendant", id)
    await expect(cmdk.input).toHaveAttribute("aria-controls", await cmdk.list.getAttribute("id"))
    await expect(cmdk.input).toHaveAttribute("aria-label", "Command Menu")
  })

  test("publishes the list height for the theme", async ({ cmdk }) => {
    await expect.poll(() => cmdk.list.evaluate(list => list.style.getPropertyValue("--cmdk-list-height"))).toMatch(/^\d+(\.\d)?px$/)
  })
})
