import { expect, test } from "../test_helper.js"

test.beforeEach(async ({ page }) => {
  await page.goto("/numeric.html")
})

test("filters numeric searches", async ({ cmdk }) => {
  await cmdk.type("112")

  await expect(cmdk.item("removed")).toHaveCount(0)
  await expect(cmdk.item("foo.bar112.value")).toHaveCount(1)
})

test("filters non-numeric searches", async ({ cmdk }) => {
  await cmdk.type("bar")

  await expect(cmdk.item("removed")).toHaveCount(0)
  await expect(cmdk.item("foo.bar112.value")).toHaveCount(1)
})
