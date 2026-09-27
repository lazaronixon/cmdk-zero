import { describe, expect, test } from "vitest"
import { resolveKeyAction } from "src/menu/keyboard"

function key(key, properties = {}) {
  return { key, defaultPrevented: false, isComposing: false, keyCode: 0, ...properties }
}

describe("resolveKeyAction", () => {
  test.each([
    [ "ArrowDown", {}, "next" ],
    [ "ArrowUp", {}, "previous" ],
    [ "ArrowDown", { metaKey: true }, "last" ],
    [ "ArrowUp", { metaKey: true }, "first" ],
    [ "ArrowDown", { altKey: true }, "next-group" ],
    [ "ArrowUp", { altKey: true }, "previous-group" ],
    [ "Home", {}, "first" ],
    [ "End", {}, "last" ],
    [ "Enter", {}, "select" ]
  ])("%s %o is %s", (name, modifiers, action) => {
    expect(resolveKeyAction(key(name, modifiers))).toBe(action)
  })

  test.each([ "j", "n" ])("Ctrl+%s moves forward like ArrowDown", name => {
    expect(resolveKeyAction(key(name, { ctrlKey: true }))).toBe("next")
    expect(resolveKeyAction(key(name, { ctrlKey: true, metaKey: true }))).toBe("last")
    expect(resolveKeyAction(key(name, { ctrlKey: true, altKey: true }))).toBe("next-group")
  })

  test.each([ "k", "p" ])("Ctrl+%s moves backward like ArrowUp", name => {
    expect(resolveKeyAction(key(name, { ctrlKey: true }))).toBe("previous")
    expect(resolveKeyAction(key(name, { ctrlKey: true, metaKey: true }))).toBe("first")
    expect(resolveKeyAction(key(name, { ctrlKey: true, altKey: true }))).toBe("previous-group")
  })

  test("vim letters without Ctrl are just typing", () => {
    expect(resolveKeyAction(key("j"))).toBeNull()
  })

  test("vim bindings can be turned off", () => {
    expect(resolveKeyAction(key("j", { ctrlKey: true }), { vimBindings: false })).toBeNull()
    expect(resolveKeyAction(key("ArrowDown"), { vimBindings: false })).toBe("next")
  })

  test("ignores keys it does not own", () => {
    expect(resolveKeyAction(key("a"))).toBeNull()
    expect(resolveKeyAction(key("Escape"))).toBeNull()
  })

  test("ignores an event that was already handled", () => {
    expect(resolveKeyAction(key("ArrowDown", { defaultPrevented: true }))).toBeNull()
  })

  test("ignores keys while an IME is composing", () => {
    expect(resolveKeyAction(key("Enter", { isComposing: true }))).toBeNull()
    expect(resolveKeyAction(key("Enter", { keyCode: 229 }))).toBeNull()
  })
})
