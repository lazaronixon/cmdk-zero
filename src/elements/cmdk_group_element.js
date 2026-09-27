import { ensureId } from "../helpers/id_helper"

const HEADING_TAG = "cmdk-group-heading"

// A group of items under an optional heading. A `heading` attribute generates
// the `<cmdk-group-heading>` for you; write the heading element yourself when it
// needs markup of its own. Either way it stays the group's first child, and the
// group is hidden — never removed — while none of its items match.
export default class CmdkGroupElement extends HTMLElement {
  static observedAttributes = [ "heading" ]

  connectedCallback() {
    this.setAttribute("role", "group")
    this.#syncHeading()
  }

  attributeChangedCallback() {
    if (this.isConnected) this.#syncHeading()
  }

  // Groups are ranked and styled by value, so one without a heading needs a
  // `value` that is unique within the menu.
  get value() {
    return (this.getAttribute("value") ?? this.heading?.textContent ?? "").trim()
  }

  set value(newValue) {
    this.setAttribute("value", newValue)
  }

  get heading() {
    return this.querySelector(`:scope > ${HEADING_TAG}`)
  }

  get forceMount() {
    return this.hasAttribute("force-mount")
  }

  set forceMount(newValue) {
    this.toggleAttribute("force-mount", Boolean(newValue))
  }

  update({ value, isVisible }) {
    if (this.getAttribute("data-value") !== value) this.setAttribute("data-value", value)
    this.hidden = !isVisible
  }

  #syncHeading() {
    const text = this.getAttribute("heading")
    let heading = this.heading

    if (text !== null && !heading) {
      heading = document.createElement(HEADING_TAG)
      this.prepend(heading)
    }

    if (!heading) {
      this.removeAttribute("aria-labelledby")
      return
    }

    if (text !== null && heading.textContent !== text) heading.textContent = text

    // The group is announced by its heading, so reading the heading on its
    // own as well would say it twice.
    heading.setAttribute("aria-hidden", "true")
    this.setAttribute("aria-labelledby", ensureId(heading, "cmdk-group-heading"))
  }
}
