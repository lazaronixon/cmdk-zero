import { adjacentGroupItem, adjacentItem, scrollItemIntoView } from "../menu/navigation"
import { computeFiltered, defaultFilter } from "../menu/filtering"
import { sortGroups, sortItems } from "../menu/sorting"
import { ListenerBin } from "../helpers/listener_helper"
import { installStyles } from "../menu/styles"
import { resolveKeyAction } from "../menu/keyboard"

const ITEM_TAG = "cmdk-item"
const GROUP_TAG = "cmdk-group"
const LIST_TAG = "cmdk-list"
const SEPARATOR_TAG = "cmdk-separator"
const EMPTY_TAG = "cmdk-empty"

// Attributes that change what an item matches or whether it shows. Everything
// the menu writes itself — `hidden`, `data-*`, ARIA — is left out, so painting
// never wakes the observer back up.
const OBSERVED_PART_ATTRIBUTES = [ "value", "keywords", "disabled", "force-mount", "always-render", "heading" ]

// Set on the element before its definition loaded, these land as plain own
// properties and would shadow the accessors below for good.
const UPGRADABLE_PROPERTIES = [ "filter", "value", "search", "shouldFilter", "loop", "vimBindings", "disablePointerSelection" ]

export default class CmdkRootElement extends HTMLElement {
  static observedAttributes = [ "value", "label", "should-filter" ]

  #filter = null
  #input = null
  #search = ""
  #value = ""
  #selectedItem = null
  #filtered = { count: 0, items: new Map(), groups: new Set() }
  #listeners = new ListenerBin()
  #mutationObserver = null
  #upgraded = false

  connectedCallback() {
    if (this.#upgraded) return

    // Before the flag flips, so the setters only record what they were given.
    this.#upgradeProperties()
    this.#upgraded = true

    installStyles(this.getAttribute("nonce"))

    // Items describe themselves, so they have to be upgraded before the menu
    // reads them, and the order the parser reaches the definitions does not
    // guarantee that.
    customElements.upgrade(this)

    // Focusable, but out of the tab order, so a click on an item — which is
    // not focusable — keeps focus inside the menu.
    if (!this.hasAttribute("tabindex")) this.tabIndex = -1

    this.#value = (this.getAttribute("value") ?? "").trim()
    this.#adoptInput()
    this.#listenForEvents()
    this.#observeMutations()

    this.#refresh()
    if (this.#value) {
      this.#paintSelection()
      this.#scrollSelectedIntoView()
    } else {
      this.#selectFirstItem()
    }
  }

  disconnectedCallback() {
    this.#upgraded = false

    this.#listeners.dispose()
    this.#mutationObserver?.disconnect()
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.#upgraded || oldValue === newValue) return

    if (name === "value") {
      this.#select(newValue ?? "")
    } else if (name === "label") {
      this.#applyInputAttributes()
    } else {
      this.#reconcile()
    }
  }

  get value() {
    if (!this.#upgraded) return (this.getAttribute("value") ?? "").trim()
    return this.#value
  }

  set value(newValue) {
    const value = String(newValue ?? "").trim()

    if (!this.#upgraded) {
      this.setAttribute("value", value)
      return
    }

    this.#select(value)
  }

  get search() {
    return this.#search
  }

  set search(newValue) {
    const search = String(newValue ?? "")
    if (this.#input && this.#input.value !== search) this.#input.value = search
    this.#setSearch(search)
  }

  get filter() {
    return this.#filter
  }

  set filter(newValue) {
    this.#filter = typeof newValue === "function" ? newValue : null
    if (this.#upgraded) this.#reconcile()
  }

  get filtered() {
    const { count, items, groups } = this.#filtered
    return { count, items: new Map(items), groups: new Set(groups) }
  }

  get shouldFilter() {
    return this.getAttribute("should-filter") !== "false"
  }

  set shouldFilter(newValue) {
    this.setAttribute("should-filter", String(Boolean(newValue)))
  }

  get loop() {
    return this.hasAttribute("loop")
  }

  set loop(newValue) {
    this.toggleAttribute("loop", Boolean(newValue))
  }

  get vimBindings() {
    return this.getAttribute("vim-bindings") !== "false"
  }

  set vimBindings(newValue) {
    this.setAttribute("vim-bindings", String(Boolean(newValue)))
  }

  get disablePointerSelection() {
    return this.hasAttribute("disable-pointer-selection")
  }

  set disablePointerSelection(newValue) {
    this.toggleAttribute("disable-pointer-selection", Boolean(newValue))
  }

  get input() {
    return this.#input
  }

  get list() {
    return this.querySelector(LIST_TAG)
  }

  get selectedItem() {
    return this.#selectedItem
  }

  focus(options) {
    if (this.#input) {
      this.#input.focus(options)
    } else {
      super.focus(options)
    }
  }

  blur() {
    this.#input?.blur()
    super.blur()
  }

  #upgradeProperties() {
    UPGRADABLE_PROPERTIES.forEach(property => {
      if (!Object.hasOwn(this, property)) return

      const value = this[property]
      delete this[property]
      this[property] = value
    })
  }

  // The search field is optional. Without one the menu is driven from the
  // keyboard while it — or anything inside it — has focus.
  #adoptInput() {
    this.#input = this.querySelector("input[data-cmdk-input]") ?? this.querySelector("input")
    if (!this.#input) return

    // A search set before the upgrade wins over an empty field; a field the
    // browser restored wins over nothing.
    if (this.#search && !this.#input.value) this.#input.value = this.#search
    this.#search = this.#input.value
    this.#applyInputAttributes()
  }

  #applyInputAttributes() {
    const input = this.#input
    if (!input) return

    input.setAttribute("data-cmdk-input", "")
    input.setAttribute("role", "combobox")
    input.setAttribute("aria-autocomplete", "list")
    input.setAttribute("aria-expanded", "true")
    input.setAttribute("autocomplete", "off")
    input.setAttribute("autocorrect", "off")
    input.spellcheck = false

    const list = this.list
    if (list?.id) input.setAttribute("aria-controls", list.id)

    const label = this.getAttribute("label")
    if (label) input.setAttribute("aria-label", label)
  }

  #listenForEvents() {
    this.#listeners.listen(this, "keydown", event => this.#didKeyDown(event))
    this.#listeners.listen(this, "click", event => this.#didClick(event))
    this.#listeners.listen(this, "pointermove", event => this.#didMovePointer(event))

    if (this.#input) {
      this.#listeners.listen(this.#input, "input", () => this.#setSearch(this.#input.value))
    }
  }

  // Items are plain markup, so anything can add, remove or rewrite one — your
  // own script, a framework, a server-rendered fragment. Watching the subtree
  // picks all of it up, batched into one pass per task.
  #observeMutations() {
    this.#mutationObserver = new MutationObserver(() => this.#reconcile())
    this.#mutationObserver.observe(this, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: OBSERVED_PART_ATTRIBUTES
    })
  }

  #didKeyDown(event) {
    const action = resolveKeyAction(event, { vimBindings: this.vimBindings })
    if (!action) return

    event.preventDefault()

    const items = this.#selectableItems()
    const options = { loop: this.loop }

    switch (action) {
      case "next":
        this.#selectItem(adjacentItem(items, this.#selectedItem, 1, options))
        break
      case "previous":
        this.#selectItem(adjacentItem(items, this.#selectedItem, -1, options))
        break
      case "next-group":
        this.#selectItem(adjacentGroupItem(items, this.#selectedItem, 1, options))
        break
      case "previous-group":
        this.#selectItem(adjacentGroupItem(items, this.#selectedItem, -1, options))
        break
      case "first":
        this.#selectItem(items[0])
        break
      case "last":
        this.#selectItem(items.at(-1))
        break
      case "select":
        if (this.#selectedItem) this.#trigger(this.#selectedItem)
        break
    }
  }

  #didClick(event) {
    const item = this.#itemFrom(event)
    if (item) this.#trigger(item)
  }

  #didMovePointer(event) {
    if (this.disablePointerSelection) return

    const item = this.#itemFrom(event)
    if (item) this.#select(item.value, { scroll: false })
  }

  #itemFrom(event) {
    const item = event.target.closest?.(ITEM_TAG)
    if (!item || !this.contains(item) || item.disabled) return null
    return item
  }

  #trigger(item) {
    if (item.disabled) return

    this.#select(item.value, { scroll: false })
    item.dispatchEvent(new CustomEvent("cmdk:select", { detail: { value: item.value }, bubbles: true }))
  }

  #setSearch(search) {
    if (search === this.#search) return
    this.#search = search
    if (!this.#upgraded) return

    this.#refresh()
    this.dispatchEvent(new CustomEvent("cmdk:search", { detail: { search }, bubbles: true }))
    this.#selectFirstItem()
  }

  // A change the menu did not make itself: items added, removed or rewritten,
  // or a setting that changes what matches.
  #reconcile() {
    const previous = this.#selectedItem
    this.#refresh()

    const selectionIsGone = previous && (!this.contains(previous) || previous.hidden || previous.value !== this.#value)

    if (!this.#value || selectionIsGone) {
      this.#selectFirstItem()
    } else {
      this.#paintSelection()
    }
  }

  // Scores every item, shows and hides the parts, and — while searching — puts
  // the best matches first.
  #refresh() {
    const items = this.#items()
    const entries = items.map(item => {
      const group = this.#groupOf(item)
      return { key: item, value: item.value, keywords: item.keywords, group, forceMount: item.forceMount || Boolean(group?.forceMount) }
    })

    const filtered = computeFiltered({
      entries,
      search: this.#search,
      shouldFilter: this.shouldFilter,
      filter: this.#filter ?? defaultFilter
    })
    this.#filtered = filtered

    entries.forEach(({ key: item, value, forceMount }) => {
      const isVisible = forceMount || !filtered.isFiltering || filtered.items.get(item) > 0
      item.update({ value, isSelected: false, isVisible })
    })

    const groups = this.#groups()
    groups.forEach(group => {
      const isVisible = group.forceMount || !filtered.isFiltering || filtered.groups.has(group)
      group.update({ value: group.value, isVisible })
    })

    this.querySelectorAll(SEPARATOR_TAG).forEach(separator => {
      separator.hidden = !separator.hasAttribute("always-render") && this.#search !== ""
    })

    this.querySelectorAll(EMPTY_TAG).forEach(empty => {
      empty.hidden = filtered.count !== 0
    })

    if (filtered.isFiltering) {
      sortItems(items, filtered.items)
      sortGroups(groups.filter(group => filtered.groups.has(group)), filtered.items, group => items.filter(item => group.contains(item)))
    }

    // The sort just moved nodes around; those are our own mutations, not news.
    this.#mutationObserver?.takeRecords()
  }

  #selectFirstItem() {
    this.#select(this.#selectableItems()[0]?.value ?? "")
  }

  #selectItem(item) {
    if (item) this.#select(item.value)
  }

  #select(value, { scroll = true } = {}) {
    const newValue = value.trim()

    if (newValue === this.#value) {
      this.#paintSelection()
      return
    }

    this.#value = newValue

    // Screen readers follow `aria-activedescendant` only on the focused
    // element, so focus that has drifted onto the menu itself — a click on an
    // item puts it there — is handed back to the field, or to the list.
    if (document.activeElement === this) (this.#input ?? this.list)?.focus()

    this.#paintSelection()
    if (scroll) this.#scrollSelectedIntoView()

    this.dispatchEvent(new CustomEvent("cmdk:change", { detail: { value: newValue }, bubbles: true }))
  }

  // Every item with the selected value is painted as selected; the first of
  // them is the active descendant.
  #paintSelection() {
    let selected = null

    this.#items().forEach(item => {
      const value = item.value
      const isSelected = this.#value !== "" && !item.hidden && value === this.#value
      if (isSelected && !selected) selected = item

      item.update({ value, isSelected, isVisible: !item.hidden })
    })

    this.#selectedItem = selected

    const targets = [ this.#input, this.list ].filter(Boolean)
    targets.forEach(target => {
      if (selected) {
        target.setAttribute("aria-activedescendant", selected.id)
      } else {
        target.removeAttribute("aria-activedescendant")
      }
    })
  }

  #scrollSelectedIntoView() {
    if (this.#selectedItem) scrollItemIntoView(this.#selectedItem, this.#selectableItems())
  }

  #items() {
    return Array.from(this.querySelectorAll(ITEM_TAG))
  }

  #groups() {
    return Array.from(this.querySelectorAll(GROUP_TAG))
  }

  #groupOf(item) {
    return item.parentElement?.closest(GROUP_TAG) ?? null
  }

  // What the keyboard can land on, in document order.
  #selectableItems() {
    return this.#items().filter(item => !item.hidden && !item.disabled && !this.#groupOf(item)?.hidden)
  }
}
