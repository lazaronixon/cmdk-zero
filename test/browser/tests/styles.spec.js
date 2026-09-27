import { CommandHandle } from "../helpers/command_handle.js"
import { expect, test } from "../test_helper.js"

test.beforeEach(async ({ page }) => {
  await page.goto("/overrides.html")
})

test("installs one machinery stylesheet for the whole document, first in head", async ({ page }) => {
  await expect(page.locator("head #cmdk-zero-style")).toHaveCount(1)
  expect(await page.evaluate(() => document.head.firstElementChild.id)).toBe("cmdk-zero-style")
})

// Nothing in the theme file lays the parts out as rows — the script does, so a
// page that never links the theme still gets a working list.
test("lays the parts out as blocks without help from the theme", async ({ page }) => {
  const plain = new CommandHandle(page, "#plain")

  await expect(plain.element).toHaveCSS("display", "block")
  await expect(plain.item("Apple")).toHaveCSS("display", "block")
})

test("hides a filtered-out item even when the page gives it a display", async ({ page }) => {
  const overridden = new CommandHandle(page, "#overridden")

  await overridden.type("ban")

  await expect(overridden.element.locator("cmdk-item[data-value=\"Apple\"]")).toBeHidden()
  await expect(overridden.item("Banana")).toHaveCSS("display", "flex")
})

test("lets the page override the machinery's own layout defaults", async ({ page }) => {
  await expect(page.locator("#plain cmdk-list")).toHaveCSS("display", "block")
  await expect(page.locator("#overridden cmdk-list")).toHaveCSS("display", "grid")
})
