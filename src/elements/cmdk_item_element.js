import { ensureId } from "../helpers/id_helper"

// An item describes itself — its value, keywords and whether it may be chosen —
// and paints the state the menu hands it. Authored attributes are bare
// (`value`, `keywords`, `disabled`); anything written by the script is `data-*`
// or ARIA, so a selector always tells configuration from state.
export default class CmdkItemElement extends HTMLElement {
  connectedCallback() {
    this.setAttribute("role", "option")
    ensureId(this, "cmdk-item")
  }

  // Inferred from the text when there is no `value`. If that text changes
  // between renders — a counter, a timestamp — give the item a stable value.
  get value() {
    return (this.getAttribute("value") ?? this.textContent).trim()
  }

  set value(newValue) {
    this.setAttribute("value", newValue)
  }

  get keywords() {
    const attribute = this.getAttribute("keywords")
    if (!attribute) return []

    return attribute.split(",").map(keyword => keyword.trim()).filter(Boolean)
  }

  set keywords(newValue) {
    this.setAttribute("keywords", Array.from(newValue ?? []).join(", "))
  }

  get disabled() {
    return this.hasAttribute("disabled")
  }

  set disabled(newValue) {
    this.toggleAttribute("disabled", Boolean(newValue))
  }

  get forceMount() {
    return this.hasAttribute("force-mount")
  }

  set forceMount(newValue) {
    this.toggleAttribute("force-mount", Boolean(newValue))
  }

  update({ value, isSelected, isVisible }) {
    if (this.getAttribute("data-value") !== value) this.setAttribute("data-value", value)

    this.hidden = !isVisible
    this.toggleAttribute("data-selected", isSelected)
    this.toggleAttribute("data-disabled", this.disabled)
    this.setAttribute("aria-selected", String(isSelected))
    this.setAttribute("aria-disabled", String(this.disabled))
  }
}
