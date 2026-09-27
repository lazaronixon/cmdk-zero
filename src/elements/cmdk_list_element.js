import { ensureId } from "../helpers/id_helper"

const SIZER_TAG = "cmdk-list-sizer"

// The list is the scrolling box, and the sizer inside it is the content. The
// sizer's height is published as `--cmdk-list-height`, so a theme can animate
// the list's height as results come and go — something `height: auto` cannot
// transition.
export default class CmdkListElement extends HTMLElement {
  static observedAttributes = [ "label" ]

  #sizer = null
  #childObserver = null
  #resizeObserver = null
  #animationFrame = null

  connectedCallback() {
    this.setAttribute("role", "listbox")
    this.setAttribute("tabindex", "-1")
    ensureId(this, "cmdk-list")
    this.#applyLabel()

    this.#adoptSizer()
    this.#observeChildren()
    this.#observeSize()
  }

  disconnectedCallback() {
    this.#childObserver?.disconnect()
    this.#resizeObserver?.disconnect()
    cancelAnimationFrame(this.#animationFrame)
  }

  attributeChangedCallback() {
    this.#applyLabel()
  }

  get sizer() {
    return this.#sizer
  }

  #applyLabel() {
    this.setAttribute("aria-label", this.getAttribute("label") ?? "Suggestions")
  }

  #adoptSizer() {
    this.#sizer = this.querySelector(`:scope > ${SIZER_TAG}`)

    if (!this.#sizer) {
      this.#sizer = document.createElement(SIZER_TAG)
      this.#sizer.append(...this.childNodes)
      this.append(this.#sizer)
    }
  }

  // Anything appended to the list later — async results, say — belongs in the
  // sizer too, or it would be measured, sorted and scrolled as if it were not
  // part of the list.
  #observeChildren() {
    this.#childObserver = new MutationObserver(() => {
      const strays = Array.from(this.childNodes).filter(node => node !== this.#sizer)
      if (strays.length) this.#sizer.append(...strays)
    })

    this.#childObserver.observe(this, { childList: true })
  }

  // Missing in older browsers; without it the variable is simply never set.
  #observeSize() {
    if (typeof ResizeObserver === "undefined") return

    this.#resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(this.#animationFrame)
      this.#animationFrame = requestAnimationFrame(() => {
        this.style.setProperty("--cmdk-list-height", `${this.#sizer.offsetHeight.toFixed(1)}px`)
      })
    })

    this.#resizeObserver.observe(this.#sizer)
  }
}
