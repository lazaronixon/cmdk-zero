import { expect, test } from "../test_helper.js"

// Every binding comes in three spellings; the moves are the same for each.
const BINDINGS = [
  { name: "arrow", next: "ArrowDown", previous: "ArrowUp" },
  { name: "vim j/k", next: "Control+j", previous: "Control+k" },
  { name: "vim n/p", next: "Control+n", previous: "Control+p" }
]

BINDINGS.forEach(({ name, next, previous }) => {
  test.describe(`${name} keybinds`, () => {
    test.beforeEach(async ({ page, cmdk }) => {
      await page.goto("/keybinds.html")
      await cmdk.input.focus()
    })

    test("steps through the items, skipping disabled ones", async ({ cmdk }) => {
      await cmdk.expectSelected("first")

      await cmdk.press(next)
      await cmdk.expectSelected("A")

      await cmdk.press(previous)
      await cmdk.expectSelected("first")
    })

    test("with Meta, jumps to the first and last item", async ({ cmdk }) => {
      await cmdk.expectSelected("first")

      await cmdk.press(`Meta+${next}`)
      await cmdk.expectSelected("last")

      await cmdk.press(`Meta+${previous}`)
      await cmdk.expectSelected("first")
    })

    test("with Alt, jumps between groups", async ({ cmdk }) => {
      await cmdk.expectSelected("first")

      await cmdk.press(`Alt+${next}`)
      await cmdk.expectSelected("A")

      await cmdk.press(`Alt+${next}`)
      await cmdk.expectSelected("Apple")

      await cmdk.press(`Alt+${previous}`)
      await cmdk.expectSelected("A")

      await cmdk.press(`Alt+${previous}`)
      await cmdk.expectSelected("first")
    })
  })
})

test.describe("without vim bindings", () => {
  test.beforeEach(async ({ page, cmdk }) => {
    await page.goto("/keybinds.html?noVim")
    await cmdk.input.focus()
  })

  test("Ctrl+J/K does nothing", async ({ cmdk }) => {
    await cmdk.expectSelected("first")

    await cmdk.press("Control+j")
    await cmdk.expectSelected("first")

    await cmdk.press("Control+k")
    await cmdk.expectSelected("first")
  })

  test("Ctrl+N/P does nothing", async ({ cmdk }) => {
    await cmdk.expectSelected("first")

    await cmdk.press("Control+n")
    await cmdk.expectSelected("first")

    await cmdk.press("Control+p")
    await cmdk.expectSelected("first")
  })
})

test.describe("edges", () => {
  test("Home and End jump to the first and last item", async ({ page, cmdk }) => {
    await page.goto("/keybinds.html")
    await cmdk.input.focus()

    await cmdk.press("End")
    await cmdk.expectSelected("last")

    await cmdk.press("Home")
    await cmdk.expectSelected("first")
  })

  test("stops at the ends without loop", async ({ page, cmdk }) => {
    await page.goto("/keybinds.html")
    await cmdk.input.focus()

    await cmdk.press("ArrowUp")
    await cmdk.expectSelected("first")
  })

  test("wraps around with loop", async ({ page, cmdk }) => {
    await page.goto("/keybinds.html?loop")
    await cmdk.input.focus()

    await cmdk.press("ArrowUp")
    await cmdk.expectSelected("last")

    await cmdk.press("ArrowDown")
    await cmdk.expectSelected("first")
  })

  test("keeps the selected item scrolled into view", async ({ page, cmdk }) => {
    await page.goto("/keybinds.html")
    await cmdk.input.focus()

    await cmdk.press("End")

    await expect(cmdk.selected).toBeInViewport()
  })
})
