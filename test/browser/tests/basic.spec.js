import { expect, test } from "../test_helper.js"

test.beforeEach(async ({ page }) => {
  await page.goto("/basic.html")
})

test("keeps the attributes written on the input", async ({ page }) => {
  await expect(page.locator("input[placeholder=\"Search…\"]")).toHaveCount(1)
})

test("derives an item's value from its text", async ({ cmdk }) => {
  await expect(cmdk.item("Item")).toHaveText("Item")
})

test("prefers the value attribute over the text", async ({ cmdk }) => {
  await expect(cmdk.item("xxx")).toHaveText("Value")
})

test("fires cmdk:select when an item is clicked", async ({ cmdk }) => {
  await cmdk.item("Item").click()

  await cmdk.expectEvents("select", [ "Item" ])
})

test("fires cmdk:select for Enter", async ({ cmdk }) => {
  await cmdk.input.focus()
  await cmdk.press("Enter")

  await cmdk.expectEvents("select", [ "Item" ])
})

test("selects the first item by default", async ({ cmdk }) => {
  await expect(cmdk.selected).toHaveText("Item")
})

test("selects the first item when the search changes", async ({ cmdk }) => {
  await cmdk.type("x")

  await expect(cmdk.selected).toHaveText("Value")
})

test("filters items when searching", async ({ cmdk }) => {
  await cmdk.type("x")

  await expect(cmdk.item("Item")).toHaveCount(0)
  await expect(cmdk.item("xxx")).toHaveCount(1)
})

test("filters items by keywords", async ({ cmdk }) => {
  await cmdk.type("key")

  await expect(cmdk.item("xxx")).toHaveCount(0)
  await expect(cmdk.item("Item")).toHaveCount(1)
})

test("shows the empty state when nothing matches", async ({ cmdk }) => {
  await expect(cmdk.empty).toHaveCount(0)

  await cmdk.type("z")

  await expect(cmdk.items).toHaveCount(0)
  await expect(cmdk.empty).toHaveText("No results.")
})

test("keeps the classes written on each part", async ({ page, cmdk }) => {
  await expect(page.locator(".root")).toHaveCount(1)
  await expect(page.locator(".input")).toHaveCount(1)
  await expect(page.locator(".list")).toHaveCount(1)
  await expect(page.locator(".item:visible")).toHaveCount(2)

  await cmdk.type("zzzz")

  await expect(page.locator(".item:visible")).toHaveCount(0)
  await expect(page.locator(".empty:visible")).toHaveCount(1)
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
