import { adjacentGroupItem, adjacentItem, scrollItemIntoView } from "src/menu/navigation"
import { afterEach, describe, expect, test } from "vitest"
import { scrolled, unmount } from "./test_helper"

afterEach(() => unmount())

function build() {
  document.body.innerHTML = `
    <div>
      <cmdk-item value="first"></cmdk-item>
      <cmdk-group heading="Letters">
        <cmdk-item value="a"></cmdk-item>
        <cmdk-item value="b"></cmdk-item>
      </cmdk-group>
      <cmdk-group heading="Empty"></cmdk-group>
      <cmdk-group heading="Fruits">
        <cmdk-item value="apple"></cmdk-item>
      </cmdk-group>
      <cmdk-item value="last"></cmdk-item>
    </div>
  `

  const items = Array.from(document.querySelectorAll("cmdk-item"))
  const byValue = Object.fromEntries(items.map(item => [ item.getAttribute("value"), item ]))
  return { items, byValue }
}

describe("adjacentItem", () => {
  test("steps forward and backward", () => {
    const { items, byValue } = build()

    expect(adjacentItem(items, byValue.first, 1)).toBe(byValue.a)
    expect(adjacentItem(items, byValue.a, -1)).toBe(byValue.first)
  })

  test("stops at the edges", () => {
    const { items, byValue } = build()

    expect(adjacentItem(items, byValue.last, 1)).toBeNull()
    expect(adjacentItem(items, byValue.first, -1)).toBeNull()
  })

  test("wraps around with loop", () => {
    const { items, byValue } = build()

    expect(adjacentItem(items, byValue.last, 1, { loop: true })).toBe(byValue.first)
    expect(adjacentItem(items, byValue.first, -1, { loop: true })).toBe(byValue.last)
  })

  test("lands on the first item when nothing is selected", () => {
    const { items, byValue } = build()

    expect(adjacentItem(items, null, 1)).toBe(byValue.first)
  })
})

describe("adjacentGroupItem", () => {
  test("jumps to the first item of the next group, skipping empty ones", () => {
    const { items, byValue } = build()

    expect(adjacentGroupItem(items, byValue.b, 1)).toBe(byValue.apple)
  })

  test("jumps to the first item of the previous group", () => {
    const { items, byValue } = build()

    expect(adjacentGroupItem(items, byValue.apple, -1)).toBe(byValue.a)
  })

  test("falls back to a single step outside a group", () => {
    const { items, byValue } = build()

    expect(adjacentGroupItem(items, byValue.first, 1)).toBe(byValue.a)
  })

  test("falls back to a single step past the last group", () => {
    const { items, byValue } = build()

    expect(adjacentGroupItem(items, byValue.a, -1)).toBe(byValue.first)
    expect(adjacentGroupItem(items, byValue.apple, 1)).toBe(byValue.last)
  })
})

describe("scrollItemIntoView", () => {
  test("brings the heading in first for the first item of a group", () => {
    const { items, byValue } = build()

    scrollItemIntoView(byValue.a, items)

    expect(scrolled).toEqual([ document.querySelector("cmdk-group-heading"), byValue.a ])
  })

  test("scrolls only the item otherwise", () => {
    const { items, byValue } = build()

    scrollItemIntoView(byValue.b, items)

    expect(scrolled).toEqual([ byValue.b ])
  })
})
