import { afterEach, describe, expect, test } from "vitest"
import { flush, mount, press, recordEvents, scrolled, selectedValue, type, unmount, visibleValues } from "./test_helper"
import { commandScore } from "src/menu/command_score"
import { defineElements } from "src/elements/index"

afterEach(() => unmount())

const BASIC = `
  <cmdk-root label="Command Menu">
    <input placeholder="Search…">
    <cmdk-list>
      <cmdk-empty>No results.</cmdk-empty>
      <cmdk-item keywords="key">Item</cmdk-item>
      <cmdk-item value="xxx">Value</cmdk-item>
    </cmdk-list>
  </cmdk-root>
`

const GROUPS = `
  <cmdk-root>
    <input>
    <cmdk-list>
      <cmdk-empty>No results.</cmdk-empty>
      <cmdk-item value="disabled" disabled>Disabled</cmdk-item>
      <cmdk-item value="first">First</cmdk-item>
      <cmdk-group heading="Letters">
        <cmdk-item>A</cmdk-item>
        <cmdk-item>B</cmdk-item>
        <cmdk-separator></cmdk-separator>
        <cmdk-item>Z</cmdk-item>
      </cmdk-group>
      <cmdk-group heading="Fruits">
        <cmdk-item>Apple</cmdk-item>
        <cmdk-item disabled>Dragon Fruit</cmdk-item>
        <cmdk-item>Pear</cmdk-item>
      </cmdk-group>
      <cmdk-item value="last">Last</cmdk-item>
      <cmdk-item value="disabled-last" disabled>Disabled last</cmdk-item>
    </cmdk-list>
  </cmdk-root>
`

describe("rendering", () => {
  test("wires the input up as a combobox for the list", () => {
    const root = mount(BASIC)
    const list = root.querySelector("cmdk-list")

    expect(root.input.hasAttribute("data-cmdk-input")).toBe(true)
    expect(root.input.getAttribute("role")).toBe("combobox")
    expect(root.input.getAttribute("aria-autocomplete")).toBe("list")
    expect(root.input.getAttribute("aria-expanded")).toBe("true")
    expect(root.input.getAttribute("aria-controls")).toBe(list.id)
    expect(root.input.getAttribute("aria-label")).toBe("Command Menu")
    expect(root.input.getAttribute("autocomplete")).toBe("off")
    expect(root.input.spellcheck).toBe(false)
  })

  test("keeps the attributes you gave the input", () => {
    const root = mount(BASIC)

    expect(root.input.placeholder).toBe("Search…")
  })

  test("makes the list a labelled listbox", () => {
    const root = mount(BASIC)
    const list = root.querySelector("cmdk-list")

    expect(list.getAttribute("role")).toBe("listbox")
    expect(list.getAttribute("aria-label")).toBe("Suggestions")
    expect(list.getAttribute("tabindex")).toBe("-1")
  })

  test("wraps the list's children in a sizer", () => {
    const root = mount(BASIC)
    const list = root.querySelector("cmdk-list")

    expect(list.children).toHaveLength(1)
    expect(list.firstElementChild.tagName).toBe("CMDK-LIST-SIZER")
    expect(list.sizer.querySelectorAll("cmdk-item")).toHaveLength(2)
  })

  test("moves children appended to the list later into the sizer", async () => {
    const root = mount(BASIC)
    const list = root.querySelector("cmdk-list")

    list.insertAdjacentHTML("beforeend", "<cmdk-item>Late</cmdk-item>")
    await flush()

    expect(list.children).toHaveLength(1)
    expect(visibleValues(root)).toContain("Late")
  })

  test("gives every item an option role and an id", () => {
    const root = mount(BASIC)

    root.querySelectorAll("cmdk-item").forEach(item => {
      expect(item.getAttribute("role")).toBe("option")
      expect(item.id).toMatch(/^cmdk-item-\d+$/)
    })
  })

  test("labels a group by its generated heading", () => {
    const root = mount(GROUPS)
    const group = root.querySelector("cmdk-group")
    const heading = group.firstElementChild

    expect(heading.tagName).toBe("CMDK-GROUP-HEADING")
    expect(heading.textContent).toBe("Letters")
    expect(heading.getAttribute("aria-hidden")).toBe("true")
    expect(group.getAttribute("role")).toBe("group")
    expect(group.getAttribute("aria-labelledby")).toBe(heading.id)
    expect(group.getAttribute("data-value")).toBe("Letters")
  })

  test("adopts a heading you wrote yourself", () => {
    const root = mount(`
      <cmdk-root>
        <cmdk-list>
          <cmdk-group><cmdk-group-heading id="mine"><b>Bold</b></cmdk-group-heading><cmdk-item>A</cmdk-item></cmdk-group>
        </cmdk-list>
      </cmdk-root>
    `)
    const group = root.querySelector("cmdk-group")

    expect(group.querySelectorAll("cmdk-group-heading")).toHaveLength(1)
    expect(group.getAttribute("aria-labelledby")).toBe("mine")
    expect(group.value).toBe("Bold")
  })

  test("updates a generated heading when the attribute changes", () => {
    const root = mount(GROUPS)
    const group = root.querySelector("cmdk-group")

    group.setAttribute("heading", "Characters")

    expect(group.heading.textContent).toBe("Characters")
  })

  test("gives the parts their roles", () => {
    const root = mount(`
      <cmdk-root>
        <cmdk-list>
          <cmdk-empty>Nothing</cmdk-empty>
          <cmdk-separator></cmdk-separator>
          <cmdk-loading progress="40">Loading</cmdk-loading>
        </cmdk-list>
      </cmdk-root>
    `)
    const loading = root.querySelector("cmdk-loading")

    expect(root.querySelector("cmdk-empty").getAttribute("role")).toBe("presentation")
    expect(root.querySelector("cmdk-separator").getAttribute("role")).toBe("separator")
    expect(loading.getAttribute("role")).toBe("progressbar")
    expect(loading.getAttribute("aria-valuenow")).toBe("40")
    expect(loading.getAttribute("aria-valuemin")).toBe("0")
    expect(loading.getAttribute("aria-valuemax")).toBe("100")
    expect(loading.getAttribute("aria-label")).toBe("Loading...")
  })

  test("tracks loading progress", () => {
    const root = mount("<cmdk-root><cmdk-loading label=\"Fetching\"></cmdk-loading></cmdk-root>")
    const loading = root.querySelector("cmdk-loading")

    expect(loading.hasAttribute("aria-valuenow")).toBe(false)
    loading.progress = 75
    expect(loading.getAttribute("aria-valuenow")).toBe("75")
    expect(loading.getAttribute("aria-label")).toBe("Fetching")
    loading.progress = null
    expect(loading.hasAttribute("aria-valuenow")).toBe(false)
  })

  test("injects the machinery styles once, first in head", () => {
    mount(BASIC)
    mount(BASIC)

    const styles = document.querySelectorAll("#cmdk-zero-style")
    expect(styles).toHaveLength(1)
    expect(document.head.firstElementChild).toBe(styles[0])
  })

  test("defining the elements again is harmless", () => {
    expect(() => defineElements()).not.toThrow()
  })
})

describe("values", () => {
  test("derives an item's value from its text", () => {
    const root = mount(BASIC)

    expect(root.querySelector("cmdk-item").getAttribute("data-value")).toBe("Item")
  })

  test("prefers the value attribute over the text", () => {
    const root = mount(BASIC)

    expect(root.querySelectorAll("cmdk-item")[1].getAttribute("data-value")).toBe("xxx")
  })

  test("trims values and keywords", () => {
    const root = mount("<cmdk-root><cmdk-list><cmdk-item value=\"  padded  \" keywords=\" one ,  two \">x</cmdk-item></cmdk-list></cmdk-root>")
    const item = root.querySelector("cmdk-item")

    expect(item.value).toBe("padded")
    expect(item.keywords).toEqual([ "one", "two" ])
  })

  test("sets keywords from an array", () => {
    const root = mount(BASIC)
    const item = root.querySelector("cmdk-item")

    item.keywords = [ "alpha", "beta" ]

    expect(item.getAttribute("keywords")).toBe("alpha, beta")
  })

  test("re-derives an implicit value when the text changes", async () => {
    const root = mount(BASIC)
    const item = root.querySelector("cmdk-item")

    item.textContent = "Renamed"
    await flush()

    expect(item.getAttribute("data-value")).toBe("Renamed")
  })
})

describe("selection", () => {
  test("selects the first item by default", () => {
    const root = mount(BASIC)

    expect(selectedValue(root)).toBe("Item")
    expect(root.value).toBe("Item")
  })

  test("skips disabled items when selecting the first", () => {
    const root = mount(GROUPS)

    expect(selectedValue(root)).toBe("first")
  })

  test("points aria-activedescendant at the selected item", () => {
    const root = mount(BASIC)
    const selected = root.querySelector("cmdk-item[data-selected]")

    expect(root.input.getAttribute("aria-activedescendant")).toBe(selected.id)
    expect(root.querySelector("cmdk-list").getAttribute("aria-activedescendant")).toBe(selected.id)
  })

  test("paints selected and disabled state", () => {
    const root = mount(GROUPS)
    const disabled = root.querySelector("cmdk-item[disabled]")
    const selected = root.querySelector("cmdk-item[value=\"first\"]")

    expect(selected.hasAttribute("data-selected")).toBe(true)
    expect(selected.getAttribute("aria-selected")).toBe("true")
    expect(disabled.hasAttribute("data-disabled")).toBe(true)
    expect(disabled.getAttribute("aria-disabled")).toBe("true")
    expect(disabled.getAttribute("aria-selected")).toBe("false")
  })

  test("respects an initial value", () => {
    const root = mount(GROUPS.replace("<cmdk-root>", "<cmdk-root value=\"Pear\">"))

    expect(selectedValue(root)).toBe("Pear")
    expect(scrolled.at(-1)).toBe(root.querySelector("cmdk-item[data-value=\"Pear\"]"))
  })

  test("selects by setting value, and fires cmdk:change", () => {
    const root = mount(BASIC)
    const changes = recordEvents(root, "cmdk:change")

    root.value = "xxx"

    expect(selectedValue(root)).toBe("xxx")
    expect(changes).toEqual([ { value: "xxx" } ])
  })

  test("selects by changing the value attribute", () => {
    const root = mount(BASIC)

    root.setAttribute("value", "xxx")

    expect(selectedValue(root)).toBe("xxx")
  })

  test("keeps a value set before the element upgraded", () => {
    const root = document.createElement("cmdk-root")
    root.value = "xxx"

    expect(root.getAttribute("value")).toBe("xxx")
  })

  test("does not fire cmdk:change when the value stays the same", () => {
    const root = mount(BASIC)
    const changes = recordEvents(root, "cmdk:change")

    root.value = "Item"

    expect(changes).toEqual([])
  })

  test("selects an item on pointer move", () => {
    const root = mount(BASIC)
    const item = root.querySelectorAll("cmdk-item")[1]

    item.dispatchEvent(new Event("pointermove", { bubbles: true }))

    expect(selectedValue(root)).toBe("xxx")
  })

  test("ignores the pointer with disable-pointer-selection", () => {
    const root = mount(BASIC.replace("<cmdk-root", "<cmdk-root disable-pointer-selection"))
    const item = root.querySelectorAll("cmdk-item")[1]

    item.dispatchEvent(new Event("pointermove", { bubbles: true }))

    expect(selectedValue(root)).toBe("Item")
  })

  test("never selects a disabled item with the pointer", () => {
    const root = mount(GROUPS)

    root.querySelector("cmdk-item[disabled]").dispatchEvent(new Event("pointermove", { bubbles: true }))

    expect(selectedValue(root)).toBe("first")
  })

  test("hands focus from the menu back to the input", () => {
    const root = mount(BASIC)
    root.focus()
    HTMLElement.prototype.focus.call(root)

    root.value = "xxx"

    expect(document.activeElement).toBe(root.input)
  })

  test("selects the first item when the selected one is removed", async () => {
    const root = mount(BASIC)

    root.querySelector("cmdk-item").remove()
    await flush()

    expect(selectedValue(root)).toBe("xxx")
  })

  test("keeps the selection when new items are added", async () => {
    const root = mount(BASIC)
    root.value = "xxx"

    root.querySelector("cmdk-list-sizer").insertAdjacentHTML("afterbegin", "<cmdk-item>New</cmdk-item>")
    await flush()

    expect(selectedValue(root)).toBe("xxx")
  })

  test("selects the first item once items arrive in an empty menu", async () => {
    const root = mount("<cmdk-root><input><cmdk-list></cmdk-list></cmdk-root>")
    expect(root.value).toBe("")

    root.querySelector("cmdk-list-sizer").innerHTML = "<cmdk-item>One</cmdk-item><cmdk-item>Two</cmdk-item>"
    await flush()

    expect(selectedValue(root)).toBe("One")
  })
})

describe("filtering", () => {
  test("hides items that do not match the search", () => {
    const root = mount(BASIC)

    type(root, "x")

    expect(visibleValues(root)).toEqual([ "xxx" ])
    expect(root.querySelector("cmdk-item[data-value=\"Item\"]").hidden).toBe(true)
  })

  test("matches keywords", () => {
    const root = mount(BASIC)

    type(root, "key")

    expect(visibleValues(root)).toEqual([ "Item" ])
  })

  test("selects the first match when the search changes", () => {
    const root = mount(BASIC)

    type(root, "x")

    expect(selectedValue(root)).toBe("xxx")
  })

  test("fires cmdk:search", () => {
    const root = mount(BASIC)
    const searches = recordEvents(root, "cmdk:search")

    type(root, "x")

    expect(searches).toEqual([ { search: "x" } ])
    expect(root.search).toBe("x")
  })

  test("filters when search is set programmatically, and fills the input", () => {
    const root = mount(BASIC)

    root.search = "x"

    expect(root.input.value).toBe("x")
    expect(visibleValues(root)).toEqual([ "xxx" ])
  })

  test("shows the empty state when nothing matches, and clears the selection", () => {
    const root = mount(BASIC)
    const empty = root.querySelector("cmdk-empty")
    expect(empty.hidden).toBe(true)

    type(root, "z")

    expect(visibleValues(root)).toEqual([])
    expect(empty.hidden).toBe(false)
    expect(root.value).toBe("")
    expect(root.input.hasAttribute("aria-activedescendant")).toBe(false)
  })

  test("reports what it filtered", () => {
    const root = mount(BASIC)

    type(root, "x")

    const { count, items } = root.filtered
    expect(count).toBe(1)
    expect(items.get(root.querySelector("cmdk-item[value=\"xxx\"]"))).toBeGreaterThan(0)
  })

  test("sorts the best matches first", () => {
    const root = mount(`
      <cmdk-root>
        <input>
        <cmdk-list>
          <cmdk-item>Blade</cmdk-item>
          <cmdk-item>Bard</cmdk-item>
          <cmdk-item>Bad</cmdk-item>
        </cmdk-list>
      </cmdk-root>
    `)

    type(root, "bad")

    const expected = [ "Blade", "Bard", "Bad" ].sort((a, b) => commandScore(b, "bad") - commandScore(a, "bad"))
    expect(expected[0]).toBe("Bad")
    expect(visibleValues(root)).toEqual(expected)
  })

  test("sorts groups by their best match, after loose items", () => {
    const root = mount(`
      <cmdk-root>
        <input>
        <cmdk-list>
          <cmdk-group heading="Weak"><cmdk-item>Xylophone apple</cmdk-item></cmdk-group>
          <cmdk-group heading="Strong"><cmdk-item>Apple</cmdk-item></cmdk-group>
          <cmdk-item>Apple pie</cmdk-item>
        </cmdk-list>
      </cmdk-root>
    `)

    type(root, "apple")

    const order = Array.from(root.querySelector("cmdk-list-sizer").children).map(child => child.getAttribute("data-value"))
    expect(order).toEqual([ "Apple pie", "Strong", "Weak" ])
  })

  test("hides a group with no matching item", () => {
    const root = mount(GROUPS)
    const [ letters, fruits ] = root.querySelectorAll("cmdk-group")

    type(root, "z")

    expect(letters.hidden).toBe(false)
    expect(fruits.hidden).toBe(true)
  })

  test("keeps a force-mounted group and its items", () => {
    const root = mount(GROUPS)
    const letters = root.querySelector("cmdk-group")
    letters.setAttribute("force-mount", "")

    type(root, "apple")

    expect(letters.hidden).toBe(false)
    expect(visibleValues(root)).toEqual(expect.arrayContaining([ "A", "B", "Z", "Apple" ]))
  })

  test("keeps a force-mounted item", () => {
    const root = mount(BASIC.replace("<cmdk-item value=\"xxx\"", "<cmdk-item value=\"xxx\" force-mount"))

    type(root, "zzz")

    expect(visibleValues(root)).toEqual([ "xxx" ])
    expect(root.querySelector("cmdk-empty").hidden).toBe(false)
  })

  test("hides separators while searching, unless always-render", () => {
    const root = mount(`
      <cmdk-root>
        <input>
        <cmdk-list>
          <cmdk-item>A</cmdk-item>
          <cmdk-separator id="plain"></cmdk-separator>
          <cmdk-separator id="always" always-render></cmdk-separator>
        </cmdk-list>
      </cmdk-root>
    `)

    type(root, "a")

    expect(root.querySelector("#plain").hidden).toBe(true)
    expect(root.querySelector("#always").hidden).toBe(false)

    type(root, "")

    expect(root.querySelector("#plain").hidden).toBe(false)
  })

  test("filters nothing with should-filter=\"false\"", () => {
    const root = mount(BASIC.replace("<cmdk-root", "<cmdk-root should-filter=\"false\""))

    type(root, "zzz")

    expect(visibleValues(root)).toEqual([ "Item", "xxx" ])
    expect(root.shouldFilter).toBe(false)
  })

  test("refilters when should-filter changes", () => {
    const root = mount(BASIC)
    type(root, "x")

    root.shouldFilter = false

    expect(visibleValues(root).sort()).toEqual([ "Item", "xxx" ])
  })

  test("uses a custom filter", () => {
    const root = mount(`
      <cmdk-root>
        <input>
        <cmdk-list>
          <cmdk-item>ant</cmdk-item>
          <cmdk-item>anteater</cmdk-item>
        </cmdk-list>
      </cmdk-root>
    `)
    root.filter = (value, search) => (value.endsWith(search) ? 1 : 0)

    type(root, "ant")

    expect(visibleValues(root)).toEqual([ "ant" ])
    expect(typeof root.filter).toBe("function")
  })

  test("matches an item added while searching", async () => {
    const root = mount(BASIC)
    type(root, "b")
    expect(visibleValues(root)).toEqual([])

    root.querySelector("cmdk-list-sizer").insertAdjacentHTML("beforeend", "<cmdk-item>B</cmdk-item>")
    await flush()

    expect(visibleValues(root)).toEqual([ "B" ])
    expect(selectedValue(root)).toBe("B")
  })

  test("refilters an item whose value changes", async () => {
    const root = mount(BASIC)
    type(root, "x")

    root.querySelector("cmdk-item[value=\"xxx\"]").setAttribute("value", "yyy")
    await flush()

    expect(visibleValues(root)).toEqual([])
  })
})

describe("keyboard", () => {
  test("moves the selection with the arrow keys, skipping disabled items", () => {
    const root = mount(GROUPS)

    press(root, "ArrowDown")
    expect(selectedValue(root)).toBe("A")

    press(root, "ArrowUp")
    expect(selectedValue(root)).toBe("first")
  })

  test("prevents the default of the keys it handles", () => {
    const root = mount(GROUPS)

    expect(press(root, "ArrowDown").defaultPrevented).toBe(true)
    expect(press(root, "a").defaultPrevented).toBe(false)
  })

  test("jumps to the ends with Meta, Home and End", () => {
    const root = mount(GROUPS)

    press(root, "ArrowDown", { metaKey: true })
    expect(selectedValue(root)).toBe("last")

    press(root, "ArrowUp", { metaKey: true })
    expect(selectedValue(root)).toBe("first")

    press(root, "End")
    expect(selectedValue(root)).toBe("last")

    press(root, "Home")
    expect(selectedValue(root)).toBe("first")
  })

  test("jumps between groups with Alt", () => {
    const root = mount(GROUPS)

    press(root, "ArrowDown", { altKey: true })
    expect(selectedValue(root)).toBe("A")

    press(root, "ArrowDown", { altKey: true })
    expect(selectedValue(root)).toBe("Apple")

    press(root, "ArrowUp", { altKey: true })
    expect(selectedValue(root)).toBe("A")

    press(root, "ArrowUp", { altKey: true })
    expect(selectedValue(root)).toBe("first")
  })

  test("moves with Ctrl+J/K and Ctrl+N/P", () => {
    const root = mount(GROUPS)

    press(root, "j", { ctrlKey: true })
    expect(selectedValue(root)).toBe("A")
    press(root, "n", { ctrlKey: true })
    expect(selectedValue(root)).toBe("B")
    press(root, "p", { ctrlKey: true })
    expect(selectedValue(root)).toBe("A")
    press(root, "k", { ctrlKey: true })
    expect(selectedValue(root)).toBe("first")
  })

  test("ignores Ctrl+J/K with vim-bindings=\"false\"", () => {
    const root = mount(GROUPS.replace("<cmdk-root>", "<cmdk-root vim-bindings=\"false\">"))

    press(root, "j", { ctrlKey: true })
    expect(selectedValue(root)).toBe("first")
    expect(root.vimBindings).toBe(false)
  })

  test("stops at the edges without loop", () => {
    const root = mount(GROUPS)

    press(root, "ArrowUp")
    expect(selectedValue(root)).toBe("first")
  })

  test("wraps around with loop", () => {
    const root = mount(GROUPS.replace("<cmdk-root>", "<cmdk-root loop>"))

    press(root, "ArrowUp")
    expect(selectedValue(root)).toBe("last")

    press(root, "ArrowDown")
    expect(selectedValue(root)).toBe("first")
  })

  test("only walks visible items", () => {
    const root = mount(GROUPS)
    type(root, "a")
    const visible = visibleValues(root).filter(value => !value.startsWith("disabled") && value !== "Dragon Fruit")

    press(root, "End")

    expect(selectedValue(root)).toBe(visible.at(-1))
  })

  test("scrolls the selected item into view", () => {
    const root = mount(GROUPS)
    scrolled.length = 0

    press(root, "End")

    expect(scrolled.at(-1)).toBe(root.querySelector("cmdk-item[value=\"last\"]"))
  })

  test("ignores keys while an IME is composing", () => {
    const root = mount(GROUPS)

    press(root, "ArrowDown", { isComposing: true })

    expect(selectedValue(root)).toBe("first")
  })

  test("leaves an event you already handled alone", () => {
    const root = mount(GROUPS)
    root.input.addEventListener("keydown", event => event.preventDefault())

    press(root, "ArrowDown")

    expect(selectedValue(root)).toBe("first")
  })

  test("works without an input, from the menu itself", () => {
    const root = mount(GROUPS.replace("<input>", ""))

    press(root, "ArrowDown")

    expect(root.input).toBeNull()
    expect(selectedValue(root)).toBe("A")
  })
})

describe("choosing", () => {
  test("fires cmdk:select on the item for Enter", () => {
    const root = mount(BASIC)
    const item = root.querySelector("cmdk-item")
    const selections = recordEvents(item, "cmdk:select")

    press(root, "Enter")

    expect(selections).toEqual([ { value: "Item" } ])
  })

  test("fires cmdk:select on click, and selects the item", () => {
    const root = mount(BASIC)
    const item = root.querySelectorAll("cmdk-item")[1]
    const selections = recordEvents(root, "cmdk:select")

    item.click()

    expect(selections).toEqual([ { value: "xxx" } ])
    expect(selectedValue(root)).toBe("xxx")
  })

  test("never fires for a disabled item", () => {
    const root = mount(GROUPS)
    const selections = recordEvents(root, "cmdk:select")

    root.querySelector("cmdk-item[disabled]").click()

    expect(selections).toEqual([])
  })

  test("does nothing on Enter with nothing selected", () => {
    const root = mount(BASIC)
    const selections = recordEvents(root, "cmdk:select")
    type(root, "zzz")

    press(root, "Enter")

    expect(selections).toEqual([])
  })
})

describe("properties", () => {
  test("reflect their attributes", () => {
    const root = mount(BASIC)
    const item = root.querySelector("cmdk-item")
    const separator = document.createElement("cmdk-separator")
    const group = document.createElement("cmdk-group")

    root.loop = true
    root.vimBindings = false
    root.disablePointerSelection = true
    item.disabled = true
    item.forceMount = true
    item.value = "new"
    separator.alwaysRender = true
    group.forceMount = true
    group.value = "grouped"

    expect(root.getAttribute("vim-bindings")).toBe("false")
    expect(root.hasAttribute("loop")).toBe(true)
    expect(root.hasAttribute("disable-pointer-selection")).toBe(true)
    expect(item.hasAttribute("disabled")).toBe(true)
    expect(item.hasAttribute("force-mount")).toBe(true)
    expect(item.getAttribute("value")).toBe("new")
    expect(separator.hasAttribute("always-render")).toBe(true)
    expect(group.hasAttribute("force-mount")).toBe(true)
    expect(group.value).toBe("grouped")
  })

  test("exposes the list and the selected item", () => {
    const root = mount(BASIC)

    expect(root.list).toBe(root.querySelector("cmdk-list"))
    expect(root.selectedItem).toBe(root.querySelector("cmdk-item"))
  })

  test("focus() and blur() move focus to and from the input", () => {
    const root = mount(BASIC)

    root.focus()
    expect(document.activeElement).toBe(root.input)

    root.blur()
    expect(document.activeElement).not.toBe(root.input)
  })
})

describe("lifecycle", () => {
  test("stops listening once disconnected", async () => {
    const root = mount(BASIC)
    const input = root.input
    root.remove()

    input.value = "x"
    input.dispatchEvent(new Event("input"))

    expect(root.search).toBe("")
  })

  test("picks up again when reconnected", () => {
    const root = mount(BASIC)
    root.remove()
    document.body.append(root)

    type(root, "x")

    expect(visibleValues(root)).toEqual([ "xxx" ])
  })

  test("upgrades a menu created from script", () => {
    const root = document.createElement("cmdk-root")
    root.innerHTML = "<input><cmdk-list><cmdk-item>A</cmdk-item><cmdk-item>B</cmdk-item></cmdk-list>"
    document.body.append(root)

    expect(selectedValue(root)).toBe("A")
    expect(root.querySelector("cmdk-list-sizer")).not.toBeNull()
  })

  test("keeps properties set before the element was defined", async () => {
    document.body.innerHTML = "<cmdk-early><input><cmdk-list><cmdk-item>ant</cmdk-item><cmdk-item>anteater</cmdk-item></cmdk-list></cmdk-early>"
    const root = document.querySelector("cmdk-early")
    root.filter = (value, search) => (value.endsWith(search) ? 1 : 0)
    root.value = "anteater"
    root.loop = true

    customElements.define("cmdk-early", class extends customElements.get("cmdk-root") {})

    expect(root.hasAttribute("loop")).toBe(true)
    expect(selectedValue(root)).toBe("anteater")

    type(root, "ant")
    expect(visibleValues(root)).toEqual([ "ant" ])
  })

  test("uses a search set before the upgrade", () => {
    const root = document.createElement("cmdk-root")
    root.search = "b"
    root.innerHTML = "<input><cmdk-list><cmdk-item>A</cmdk-item><cmdk-item>B</cmdk-item></cmdk-list>"
    document.body.append(root)

    expect(root.input.value).toBe("b")
    expect(visibleValues(root)).toEqual([ "B" ])
  })
})
