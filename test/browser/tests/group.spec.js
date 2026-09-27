// Ports cmdk/test/group.test.ts under its own titles; the tests cmdk-zero adds
// on top of it live in the "cmdk-zero" block at the end.
import { expect, test } from "../test_helper.js"

test.beforeEach(async ({ page }) => {
  await page.goto("/group.html")
})

test.describe("group", () => {
  test("groups are shown/hidden based on item matches", async ({ cmdk }) => {
    await cmdk.type("z")

    await expect(cmdk.group("Animals")).not.toBeVisible()
    await expect(cmdk.group("Letters")).toBeVisible()
  })

  test("group can be progressively rendered", async ({ cmdk }) => {
    await expect(cmdk.group("Numbers")).not.toBeVisible()

    await cmdk.type("t")

    await expect(cmdk.group("Animals")).not.toBeVisible()
    await expect(cmdk.group("Letters")).not.toBeVisible()
    await expect(cmdk.group("Numbers")).toBeVisible()
  })

  test("mounted group still rendered with filter using forceMount", async ({ page, cmdk }) => {
    await page.getByTestId("forceMount").click()

    await cmdk.type("Giraffe")

    await expect(cmdk.group("Letters")).toBeVisible()
  })
})

test.describe("cmdk-zero", () => {
  test("labels each group by its heading", async ({ cmdk }) => {
    const group = cmdk.group("Animals")
    const heading = group.locator("cmdk-group-heading")

    await expect(group).toHaveAttribute("role", "group")
    await expect(group).toHaveAttribute("aria-labelledby", await heading.getAttribute("id"))
    await expect(heading).toHaveText("Animals")
  })

  test("the heading of the first item comes into view with it", async ({ cmdk }) => {
    await cmdk.input.focus()
    await cmdk.press("End")
    await cmdk.press("Home")

    await expect(cmdk.group("Animals").locator("cmdk-group-heading")).toBeInViewport()
  })
})
