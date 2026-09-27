import { expect, test } from "../test_helper.js"

test.describe("item", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/item.html")
  })

  test("an item added while searching shows when it matches", async ({ page, cmdk }) => {
    await cmdk.type("b")
    await expect(cmdk.items).toHaveCount(0)

    await page.getByTestId("mount").click()

    await expect(cmdk.items).toHaveText("B")
  })

  test("an item added while searching stays hidden when it does not match", async ({ page, cmdk }) => {
    await cmdk.type("z")
    await expect(cmdk.items).toHaveCount(0)

    await page.getByTestId("mount").click()

    await expect(cmdk.items).toHaveCount(0)
  })

  test("removing the selected item selects the first one left", async ({ page, cmdk }) => {
    await page.getByTestId("mount").click()
    await expect(cmdk.selected).toHaveText("A")

    await page.getByTestId("unmount").click()

    await expect(cmdk.items).toHaveCount(1)
    await expect(cmdk.selected).toHaveText("B")
  })

  test("removing the only item leaves none", async ({ page, cmdk }) => {
    await page.getByTestId("unmount").click()

    await expect(cmdk.items).toHaveCount(0)
  })

  test("adding the only item hides the empty state", async ({ page, cmdk }) => {
    await page.getByTestId("unmount").click()
    await expect(cmdk.empty).toHaveCount(1)

    await page.getByTestId("mount").click()

    await expect(cmdk.empty).toHaveCount(0)
    await expect(cmdk.items).toHaveCount(1)
  })

  test("adding items keeps the selection", async ({ page, cmdk }) => {
    await page.getByTestId("mount").click()
    await cmdk.item("B").click()
    await expect(cmdk.selected).toHaveText("B")

    await page.getByTestId("many").click()

    await expect(cmdk.selected).toHaveText("B")
  })

  test("a force-mounted item shows regardless of the search", async ({ page, cmdk }) => {
    await page.getByTestId("forceMount").click()

    await cmdk.type("z")

    await expect(cmdk.items).toHaveCount(1)
  })
})

test.describe("item, advanced", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/item-advanced.html")
  })

  test("text that changes is matched again", async ({ page, cmdk }) => {
    await expect(cmdk.items).toHaveCount(2)
    await cmdk.type("2")

    const button = page.getByTestId("increment")
    await button.click()
    await expect(cmdk.items).toHaveCount(0)

    await button.click()
    await expect(cmdk.items).toHaveCount(2)
  })
})
