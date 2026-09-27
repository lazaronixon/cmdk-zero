// Ports cmdk/test/props.test.ts under its own titles. Upstream's controlled
// props are the `value` and `search` properties, set from the fixture buttons.
import { expect, test } from "../test_helper.js"

test.describe("props", () => {
  test("results do not change when filtering is disabled", async ({ page, cmdk }) => {
    await page.goto("/props.html?shouldFilter=false")
    await expect(cmdk.items).toHaveCount(2)

    await cmdk.type("z")

    await expect(cmdk.items).toHaveCount(2)
  })

  test("results match against custom filter", async ({ page, cmdk }) => {
    await page.goto("/props.html?customFilter=true")

    await cmdk.type("ant")

    await expect(cmdk.items).toHaveAttribute("data-value", "ant")
    await expect(cmdk.element.locator("cmdk-item[data-value=\"anteater\"]")).toBeHidden()
  })

  test("controlled value", async ({ page, cmdk }) => {
    await page.goto("/props.html")
    await cmdk.expectSelected("ant")

    await page.getByTestId("controlledValue").click()

    await cmdk.expectSelected("anteater")
  })

  test("keep controlled value if empty results", async ({ page, cmdk }) => {
    await page.goto("/props.html")
    const value = page.getByTestId("value")
    await expect(value).toHaveText("ant")

    await cmdk.fill("d")
    await expect(value).toHaveText("")

    await cmdk.fill("ant")
    await expect(value).toHaveText("ant")
  })

  test("controlled search", async ({ page, cmdk }) => {
    await page.goto("/props.html")
    await cmdk.expectSelected("ant")

    await page.getByTestId("controlledSearch").click()

    await cmdk.expectSelected("anteater")
    await expect(cmdk.input).toHaveValue("eat")
    await expect(page.getByTestId("search")).toHaveText("eat")
  })

  test("keep focus on the provided initial value", async ({ page, cmdk }) => {
    await page.goto("/props.html?initialValue=anteater")

    await cmdk.expectSelected("anteater")
  })
})
