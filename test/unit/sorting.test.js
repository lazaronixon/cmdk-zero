import { afterEach, describe, expect, test } from "vitest"
import { sortGroups, sortItems } from "src/menu/sorting"
import { unmount } from "./test_helper"

afterEach(() => unmount())

function order(selector) {
  return Array.from(document.querySelectorAll(selector)).map(element => element.getAttribute("value"))
}

describe("sortItems", () => {
  test("orders items by score within their container, keeping ties in place", () => {
    document.body.innerHTML = `
      <cmdk-list-sizer>
        <cmdk-item value="a"></cmdk-item>
        <cmdk-item value="b"></cmdk-item>
        <cmdk-item value="c"></cmdk-item>
        <cmdk-group>
          <cmdk-group-heading>Heading</cmdk-group-heading>
          <cmdk-item value="d"></cmdk-item>
          <cmdk-item value="e"></cmdk-item>
        </cmdk-group>
      </cmdk-list-sizer>
    `

    const items = Array.from(document.querySelectorAll("cmdk-item"))
    const scores = new Map(items.map(item => [ item, { a: 0.1, b: 0.9, c: 0.1, d: 0.2, e: 0.8 }[item.getAttribute("value")] ]))

    sortItems(items, scores)

    expect(order("cmdk-list-sizer > cmdk-item")).toEqual([ "b", "a", "c" ])
    expect(order("cmdk-group > cmdk-item")).toEqual([ "e", "d" ])
    expect(document.querySelector("cmdk-group").firstElementChild.tagName).toBe("CMDK-GROUP-HEADING")
  })

  test("moves an item together with the wrapper around it", () => {
    document.body.innerHTML = `
      <cmdk-list-sizer>
        <div class="wrapper"><cmdk-item value="a"></cmdk-item></div>
        <cmdk-item value="b"></cmdk-item>
      </cmdk-list-sizer>
    `

    const items = Array.from(document.querySelectorAll("cmdk-item"))
    sortItems(items, new Map([ [ items[0], 1 ], [ items[1], 0.5 ] ]))

    expect(document.querySelector("cmdk-list-sizer").lastElementChild.tagName).toBe("CMDK-ITEM")
  })
})

describe("sortGroups", () => {
  test("orders groups by their best item and puts them after loose items", () => {
    document.body.innerHTML = `
      <cmdk-list-sizer>
        <cmdk-group value="low"><cmdk-item value="a"></cmdk-item></cmdk-group>
        <cmdk-group value="high"><cmdk-item value="b"></cmdk-item></cmdk-group>
        <cmdk-item value="loose"></cmdk-item>
      </cmdk-list-sizer>
    `

    const groups = Array.from(document.querySelectorAll("cmdk-group"))
    const [ a, b ] = document.querySelectorAll("cmdk-group cmdk-item")
    const scores = new Map([ [ a, 0.2 ], [ b, 0.9 ] ])

    sortGroups(groups, scores, group => Array.from(group.querySelectorAll("cmdk-item")))

    const children = Array.from(document.querySelector("cmdk-list-sizer").children).map(element => element.getAttribute("value"))
    expect(children).toEqual([ "loose", "high", "low" ])
  })
})
