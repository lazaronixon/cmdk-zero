import { expect } from "@playwright/test"

// Filtering hides items rather than removing them, so "the items" always means
// the visible ones — the same set upstream's tests count.
export class CommandHandle {
  constructor(page, selector = "cmdk-root") {
    this.page = page
    this.selector = selector
  }

  get element() {
    return this.page.locator(this.selector)
  }

  get input() {
    return this.element.locator("[data-cmdk-input]")
  }

  get list() {
    return this.element.locator("cmdk-list")
  }

  get items() {
    return this.element.locator("cmdk-item:not([hidden])")
  }

  item(value) {
    return this.element.locator(`cmdk-item[data-value="${value}"]:not([hidden])`)
  }

  group(value) {
    return this.element.locator(`cmdk-group[data-value="${value}"]`)
  }

  get selected() {
    return this.element.locator("cmdk-item[aria-selected=\"true\"]")
  }

  get empty() {
    return this.element.locator("cmdk-empty:not([hidden])")
  }

  async type(text) {
    await this.input.pressSequentially(text, { delay: 10 })
  }

  async fill(text) {
    await this.input.fill(text)
  }

  async press(key) {
    await this.input.press(key)
  }

  async values() {
    return this.items.evaluateAll(items => items.map(item => item.getAttribute("data-value")))
  }

  async events(name) {
    return this.page.evaluate(eventName => globalThis.recordedEvents[eventName] ?? [], name)
  }

  async expectSelected(value) {
    await expect(this.selected).toHaveAttribute("data-value", value)
  }

  async expectEvents(name, values) {
    await expect.poll(() => this.events(name)).toEqual(values)
  }
}
