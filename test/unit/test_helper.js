import "cmdk-zero"

// jsdom does not implement ResizeObserver, and the list treats it as optional,
// but stubbing it keeps the tested path identical to a browser's.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// jsdom has no layout, so there is nothing to scroll; the calls are recorded
// instead so a test can tell whether one happened.
export const scrolled = []
Element.prototype.scrollIntoView = function () {
  scrolled.push(this)
}

export function mount(html) {
  document.body.innerHTML = html
  return document.querySelector("cmdk-root")
}

export function unmount() {
  document.body.innerHTML = ""
  scrolled.length = 0
}

// Mutation observers deliver in a microtask, so anything that changes the
// markup has to wait for the menu to catch up.
export function flush() {
  return new Promise(resolve => setTimeout(resolve, 0))
}

export function type(root, text) {
  const input = root.input
  input.value = text
  input.dispatchEvent(new Event("input", { bubbles: true }))
}

export function press(root, key, modifiers = {}) {
  const target = root.input ?? root
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...modifiers })
  target.dispatchEvent(event)
  return event
}

export function visibleValues(root) {
  return Array.from(root.querySelectorAll("cmdk-item:not([hidden])")).map(item => item.getAttribute("data-value"))
}

export function selectedValue(root) {
  return root.querySelector("cmdk-item[aria-selected=\"true\"]")?.getAttribute("data-value") ?? null
}

export function recordEvents(target, name) {
  const events = []
  target.addEventListener(name, event => events.push(event.detail))
  return events
}
