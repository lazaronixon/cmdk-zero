// Ports cmdk/test/item.test.ts under its own titles. Upstream's React toggles
// are fixture buttons that append and remove the elements.
import { expect, test } from "../test_helper.js"

test.describe("item", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/item.html")
  })

  test("mounted item matches search", async ({ page, cmdk }) => {
    await cmdk.type("b")
    await expect(cmdk.items).toHaveCount(0)

    await page.getByTestId("mount").click()

    await expect(cmdk.items).toHaveText("B")
  })

  test("mounted item does not match search", async ({ page, cmdk }) => {
    await cmdk.type("z")
    await expect(cmdk.items).toHaveCount(0)

    await page.getByTestId("mount").click()

    await expect(cmdk.items).toHaveCount(0)
  })

  test("unmount item that is selected", async ({ page, cmdk }) => {
    await page.getByTestId("mount").click()
    await expect(cmdk.selected).toHaveText("A")

    await page.getByTestId("unmount").click()

    await expect(cmdk.items).toHaveCount(1)
    await expect(cmdk.selected).toHaveText("B")
  })

  test("unmount item that is the only result", async ({ page, cmdk }) => {
    await page.getByTestId("unmount").click()

    await expect(cmdk.items).toHaveCount(0)
  })

  test("mount item that is the only result", async ({ page, cmdk }) => {
    await page.getByTestId("unmount").click()
    await expect(cmdk.empty).toHaveCount(1)

    await page.getByTestId("mount").click()

    await expect(cmdk.empty).toHaveCount(0)
    await expect(cmdk.items).toHaveCount(1)
  })

  test("selected does not change when mounting new items", async ({ page, cmdk }) => {
    await page.getByTestId("mount").click()
    await cmdk.item("B").click()
    await expect(cmdk.selected).toHaveText("B")
    const changes = await cmdk.events("change")

    await page.getByTestId("many").click()

    await expect(cmdk.items).toHaveCount(5)
    await expect(cmdk.selected).toHaveText("B")
    expect(await cmdk.events("change")).toEqual(changes)
  })

  test("mounted item still rendered with filter usingForceMount", async ({ page, cmdk }) => {
    await page.getByTestId("forceMount").click()

    await cmdk.type("z")

    await expect(cmdk.items).toHaveCount(1)
  })
})

test.describe("item advanced", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/item-advanced.html")
  })

  test("re-rendering re-matches implicit textContent value", async ({ page, cmdk }) => {
    await expect(cmdk.items).toHaveCount(2)
    await cmdk.type("2")

    const button = page.getByTestId("increment")
    await button.click()
    await expect(cmdk.items).toHaveCount(0)

    await button.click()
    await expect(cmdk.items).toHaveCount(2)
  })
})
