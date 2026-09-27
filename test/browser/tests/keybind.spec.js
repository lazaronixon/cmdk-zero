// Ports cmdk/test/keybind.test.ts under its own titles; the tests cmdk-zero
// adds on top of it live in the "cmdk-zero" blocks at the end.
import { expect, test } from "../test_helper.js"

// Presses each key in turn and checks where the selection landed, starting
// from the first selectable item.
async function walk(cmdk, steps) {
  await cmdk.expectSelected("first")

  for (const [ key, value ] of steps) {
    await cmdk.press(key)
    await cmdk.expectSelected(value)
  }
}

test.describe("arrow keybinds", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/keybinds.html")
  })

  test("arrow up/down changes selected item", async ({ cmdk }) => {
    await walk(cmdk, [ [ "ArrowDown", "A" ], [ "ArrowUp", "first" ] ])
  })

  test("meta arrow up/down goes to first and last item", async ({ cmdk }) => {
    await walk(cmdk, [ [ "Meta+ArrowDown", "last" ], [ "Meta+ArrowUp", "first" ] ])
  })

  test("alt arrow up/down goes to next and prev item", async ({ cmdk }) => {
    await walk(cmdk, [ [ "Alt+ArrowDown", "A" ], [ "Alt+ArrowDown", "Apple" ], [ "Alt+ArrowUp", "A" ], [ "Alt+ArrowUp", "first" ] ])
  })
})

test.describe("vim jk keybinds", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/keybinds.html")
  })

  test("ctrl j/k changes selected item", async ({ cmdk }) => {
    await walk(cmdk, [ [ "Control+j", "A" ], [ "Control+k", "first" ] ])
  })

  test("meta ctrl j/k goes to first and last item", async ({ cmdk }) => {
    await walk(cmdk, [ [ "Meta+Control+j", "last" ], [ "Meta+Control+k", "first" ] ])
  })

  test("alt ctrl j/k goes to next and prev item", async ({ cmdk }) => {
    await walk(cmdk, [ [ "Alt+Control+j", "A" ], [ "Alt+Control+j", "Apple" ], [ "Alt+Control+k", "A" ], [ "Alt+Control+k", "first" ] ])
  })
})

test.describe("vim np keybinds", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/keybinds.html")
  })

  test("ctrl n/p changes selected item", async ({ cmdk }) => {
    await walk(cmdk, [ [ "Control+n", "A" ], [ "Control+p", "first" ] ])
  })

  test("meta ctrl n/p goes to first and last item", async ({ cmdk }) => {
    await walk(cmdk, [ [ "Meta+Control+n", "last" ], [ "Meta+Control+p", "first" ] ])
  })

  test("alt ctrl n/p goes to next and prev item", async ({ cmdk }) => {
    await walk(cmdk, [ [ "Alt+Control+n", "A" ], [ "Alt+Control+n", "Apple" ], [ "Alt+Control+p", "A" ], [ "Alt+Control+p", "first" ] ])
  })
})

test.describe("no-vim keybinds", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/keybinds.html?noVim=true")
  })

  test("ctrl j/k does nothing", async ({ cmdk }) => {
    await walk(cmdk, [ [ "Control+j", "first" ], [ "Control+k", "first" ] ])
  })

  test("ctrl n/p does nothing", async ({ cmdk }) => {
    await walk(cmdk, [ [ "Control+n", "first" ], [ "Control+p", "first" ] ])
  })
})

test.describe("cmdk-zero", () => {
  test.describe("scrolling", () => {
    // The playground's third menu sits below the fold of a 600px viewport.
    test("loading a page never scrolls it to a menu below the fold", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 600 })
      await page.goto("/index.html")

      await expect(page.locator("cmdk-root").nth(2).locator("cmdk-item[data-selected]")).toHaveCount(1)
      expect(await page.evaluate(() => scrollY)).toBe(0)
    })

    test("an initial value far down the list is scrolled into the list's view", async ({ page, cmdk }) => {
      await page.goto("/keybinds.html?initialValue=last")

      await cmdk.expectSelected("last")
      await expect(cmdk.selected).toBeInViewport({ ratio: 1 })
    })

    test("keeps the selected item scrolled into view", async ({ page, cmdk }) => {
      await page.goto("/keybinds.html")

      await cmdk.press("End")

      await expect(cmdk.selected).toBeInViewport()
    })

    test("keeps the selected item in view when the list shrinks", async ({ page, cmdk }) => {
      await page.goto("/keybinds.html")
      await cmdk.press("End")
      await expect(cmdk.selected).toBeInViewport()

      await cmdk.element.evaluate(root => root.style.setProperty("--cmdk-list-height-limit", "8rem"))

      await expect.poll(() => cmdk.list.evaluate(list => list.clientHeight)).toBeLessThan(140)
      await expect(cmdk.selected).toBeInViewport({ ratio: 1 })
    })
  })

  test.describe("edges", () => {
    test("Home and End jump to the first and last item", async ({ page, cmdk }) => {
      await page.goto("/keybinds.html")

      await walk(cmdk, [ [ "End", "last" ], [ "Home", "first" ] ])
    })

    test("stops at the ends without loop", async ({ page, cmdk }) => {
      await page.goto("/keybinds.html")

      await walk(cmdk, [ [ "ArrowUp", "first" ], [ "End", "last" ], [ "ArrowDown", "last" ] ])
    })

    test("wraps around with loop", async ({ page, cmdk }) => {
      await page.goto("/keybinds.html?loop")

      await walk(cmdk, [ [ "ArrowUp", "last" ], [ "ArrowDown", "first" ] ])
    })

    test("Enter chooses the selected item", async ({ page, cmdk }) => {
      await page.goto("/keybinds.html")

      await cmdk.press("ArrowDown")
      await cmdk.press("Enter")

      await cmdk.expectEvents("select", [ "A" ])
    })
  })
})
