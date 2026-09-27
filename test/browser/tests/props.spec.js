import { expect, test } from "../test_helper.js"

test("results do not change when filtering is turned off", async ({ page, cmdk }) => {
  await page.goto("/props.html?shouldFilter=false")
  await expect(cmdk.items).toHaveCount(2)

  await cmdk.type("z")

  await expect(cmdk.items).toHaveCount(2)
})

test("results match against a custom filter", async ({ page, cmdk }) => {
  await page.goto("/props.html?customFilter=true")

  await cmdk.type("ant")

  await expect(cmdk.items).toHaveCount(1)
  await expect(cmdk.items).toHaveAttribute("data-value", "ant")
})

test("the value can be set from outside", async ({ page, cmdk }) => {
  await page.goto("/props.html")
  await cmdk.expectSelected("ant")

  await page.getByTestId("controlledValue").click()

  await cmdk.expectSelected("anteater")
})

test("the value follows the results, even when there are none", async ({ page, cmdk }) => {
  await page.goto("/props.html")
  const value = page.getByTestId("value")
  await expect(value).toHaveText("ant")

  await cmdk.fill("d")
  await expect(value).toHaveText("")

  await cmdk.fill("ant")
  await expect(value).toHaveText("ant")
})

test("the search can be set from outside", async ({ page, cmdk }) => {
  await page.goto("/props.html")
  await cmdk.expectSelected("ant")

  await page.getByTestId("controlledSearch").click()

  await cmdk.expectSelected("anteater")
  await expect(cmdk.input).toHaveValue("eat")
  await expect(page.getByTestId("search")).toHaveText("eat")
})

test("an initial value is selected", async ({ page, cmdk }) => {
  await page.goto("/props.html?initialValue=anteater")

  await cmdk.expectSelected("anteater")
})
