import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { flush, mount, unmount } from "./test_helper"

// jsdom has no layout, so the list's observers never fire on their own. This
// stub records what is observed and lets a test deliver a resize by hand, and
// animation frames run straight away.
let observers = []

class FakeResizeObserver {
  observed = []
  disconnected = false

  constructor(callback) {
    this.callback = callback
    observers.push(this)
  }

  observe(target) { this.observed.push(target) }
  unobserve() {}
  disconnect() { this.disconnected = true }
  resize() { this.callback([]) }
}

beforeEach(() => {
  observers = []
  vi.stubGlobal("ResizeObserver", FakeResizeObserver)
  vi.stubGlobal("requestAnimationFrame", callback => { callback(); return 1 })
  vi.stubGlobal("cancelAnimationFrame", () => {})
})

afterEach(() => {
  unmount()
  vi.unstubAllGlobals()
})

const MENU = `
  <cmdk-root>
    <input>
    <cmdk-list>
      <cmdk-item>Apple</cmdk-item>
      <cmdk-item>Banana</cmdk-item>
    </cmdk-list>
  </cmdk-root>
`

function listOf(root) {
  return root.querySelector("cmdk-list")
}

describe("list height", () => {
  test("observes both the sizer and the list itself", () => {
    const list = listOf(mount(MENU))

    expect(observers.at(-1).observed).toEqual([ list.sizer, list ])
  })

  test("publishes the sizer's height as --cmdk-list-height", () => {
    const list = listOf(mount(MENU))
    Object.defineProperty(list.sizer, "offsetHeight", { value: 96.44, configurable: true })

    observers.at(-1).resize()

    expect(list.style.getPropertyValue("--cmdk-list-height")).toBe("96.4px")
  })

  test("still works without ResizeObserver, just never publishing a height", () => {
    vi.stubGlobal("ResizeObserver", undefined)
    const list = listOf(mount(MENU))

    expect(list.sizer).not.toBeNull()
    expect(list.style.getPropertyValue("--cmdk-list-height")).toBe("")
  })

  test("disconnects its observer once removed", () => {
    const root = mount(MENU)
    const observer = observers.at(-1)

    listOf(root).remove()

    expect(observer.disconnected).toBe(true)
  })
})

describe("keeping the selection in view", () => {
  // A 100px-tall list at the top of the viewport, with the selected item
  // wherever the test puts it.
  function layout(list, itemTop) {
    Object.defineProperty(list, "clientHeight", { value: 100, configurable: true })
    Object.defineProperty(list, "clientTop", { value: 0, configurable: true })
    list.getBoundingClientRect = () => ({ top: 0 })

    const item = list.querySelector("cmdk-item[data-selected]")
    item.getBoundingClientRect = () => ({ top: itemTop, bottom: itemTop + 48 })
    return item
  }

  test("scrolls the list when a resize leaves the selected item outside it", () => {
    const list = listOf(mount(MENU))
    layout(list, 90)

    observers.at(-1).resize()

    expect(list.scrollTop).toBe(38)
  })

  test("leaves the list alone when the selected item is still inside it", () => {
    const list = listOf(mount(MENU))
    layout(list, 20)

    observers.at(-1).resize()

    expect(list.scrollTop).toBe(0)
  })

  test("does nothing when nothing is selected", () => {
    const root = mount(MENU)
    const list = listOf(root)
    root.querySelectorAll("cmdk-item").forEach(item => item.remove())

    expect(() => observers.at(-1).resize()).not.toThrow()
    expect(list.scrollTop).toBe(0)
  })
})

describe("structure", () => {
  test("adopts a sizer you wrote yourself instead of wrapping it", () => {
    const list = listOf(mount(`
      <cmdk-root>
        <cmdk-list>
          <cmdk-list-sizer class="mine"><cmdk-item>Apple</cmdk-item></cmdk-list-sizer>
        </cmdk-list>
      </cmdk-root>
    `))

    expect(list.querySelectorAll("cmdk-list-sizer")).toHaveLength(1)
    expect(list.sizer.classList.contains("mine")).toBe(true)
  })

  test("keeps its sizer across a reconnect", async () => {
    const root = mount(MENU)
    const list = listOf(root)
    const sizer = list.sizer

    list.remove()
    root.append(list)
    await flush()

    expect(list.sizer).toBe(sizer)
    expect(list.querySelectorAll("cmdk-list-sizer")).toHaveLength(1)
  })

  test("follows a change to its label", () => {
    const list = listOf(mount(MENU))

    list.setAttribute("label", "Commands")

    expect(list.getAttribute("aria-label")).toBe("Commands")
  })
})
