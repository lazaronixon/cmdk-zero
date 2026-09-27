import { CommandHandle } from "../helpers/command_handle.js"
import { expect, test } from "../test_helper.js"

test.beforeEach(async ({ page }) => {
  await page.goto("/theming.html")
})

test("sizes items from the theme variables", async ({ page }) => {
  const fallback = new CommandHandle(page, "#default")
  const themed = new CommandHandle(page, "#themed")

  expect((await fallback.item("Apple").boundingBox()).height).toBeCloseTo(48, 0)
  expect((await themed.item("Apple").boundingBox()).height).toBeCloseTo(40, 0)
})

test("an inline variable beats an ancestor's", async ({ page }) => {
  const inline = new CommandHandle(page, "#inline")

  expect((await inline.item("Apple").boundingBox()).height).toBeCloseTo(64, 0)
})

test("colours the selected item from the theme", async ({ page }) => {
  const themed = new CommandHandle(page, "#themed")

  await expect(themed.selected).toHaveCSS("background-color", "rgb(0, 0, 255)")
  await expect(themed.selected).toHaveCSS("color", "rgb(255, 255, 255)")
})

test("colours the border from the theme", async ({ page }) => {
  const themed = new CommandHandle(page, "#themed")

  await expect(themed.element).toHaveCSS("border-top-color", "rgb(255, 0, 0)")
})

test("moves the selected colour with the selection", async ({ page }) => {
  const themed = new CommandHandle(page, "#themed")

  await themed.item("Banana").hover()

  await expect(themed.item("Banana")).toHaveCSS("background-color", "rgb(0, 0, 255)")
  await expect(themed.item("Apple")).not.toHaveCSS("background-color", "rgb(0, 0, 255)")
})
