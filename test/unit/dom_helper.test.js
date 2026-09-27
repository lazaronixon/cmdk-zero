import { afterEach, describe, expect, test } from "vitest"
import { childOf, findNextSibling, findPreviousSibling } from "src/helpers/dom_helper"
import { ensureId } from "src/helpers/id_helper"
import { unmount } from "./test_helper"

afterEach(() => unmount())

describe("sibling search", () => {
  test("finds the nearest matching sibling in either direction", () => {
    document.body.innerHTML = "<p id=\"a\" class=\"x\"></p><p id=\"b\"></p><p id=\"c\" class=\"x\"></p>"
    const [ a, b, c ] = document.querySelectorAll("p")

    expect(findNextSibling(a, ".x")).toBe(c)
    expect(findPreviousSibling(c, ".x")).toBe(a)
    expect(findNextSibling(c, ".x")).toBeNull()
    expect(findPreviousSibling(b, "#nothing")).toBeNull()
  })
})

describe("childOf", () => {
  test("returns the ancestor sitting directly inside the container", () => {
    document.body.innerHTML = "<section><div><span></span></div></section>"
    const section = document.querySelector("section")

    expect(childOf(section, document.querySelector("span"))).toBe(document.querySelector("div"))
    expect(childOf(section, document.querySelector("div"))).toBe(document.querySelector("div"))
  })

  test("returns null when the node is outside the container", () => {
    document.body.innerHTML = "<section></section><span></span>"

    expect(childOf(document.querySelector("section"), document.querySelector("span"))).toBeNull()
  })
})

describe("ensureId", () => {
  test("generates a unique id and keeps one you wrote", () => {
    const first = document.createElement("div")
    const second = document.createElement("div")
    const named = document.createElement("div")
    named.id = "mine"

    expect(ensureId(first, "part")).toMatch(/^part-\d+$/)
    expect(ensureId(second, "part")).not.toBe(first.id)
    expect(ensureId(named, "part")).toBe("mine")
  })
})
