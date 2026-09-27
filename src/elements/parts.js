// The small parts. Each one only knows its own role; when they show and hide is
// decided by the menu, which sees every item at once.

// Shown while the search is empty, and always with `always-render` — useful
// when you do the filtering yourself.
export class CmdkSeparatorElement extends HTMLElement {
  connectedCallback() {
    this.setAttribute("role", "separator")
  }

  get alwaysRender() {
    return this.hasAttribute("always-render")
  }

  set alwaysRender(newValue) {
    this.toggleAttribute("always-render", Boolean(newValue))
  }
}

// Shown only when no item matches the search.
export class CmdkEmptyElement extends HTMLElement {
  connectedCallback() {
    this.setAttribute("role", "presentation")
  }
}

// Render it while asynchronous items are loading, and remove it when they are
// in. A progress bar's contents are presentational, so the visible text is
// announced through `label` instead.
export class CmdkLoadingElement extends HTMLElement {
  static observedAttributes = [ "progress", "label" ]

  connectedCallback() {
    this.setAttribute("role", "progressbar")
    this.setAttribute("aria-valuemin", "0")
    this.setAttribute("aria-valuemax", "100")
    this.#applyAttributes()
  }

  attributeChangedCallback() {
    if (this.isConnected) this.#applyAttributes()
  }

  get progress() {
    const progress = this.getAttribute("progress")
    return progress === null ? null : Number(progress)
  }

  set progress(newValue) {
    if (newValue === null || newValue === undefined) {
      this.removeAttribute("progress")
    } else {
      this.setAttribute("progress", String(newValue))
    }
  }

  #applyAttributes() {
    this.setAttribute("aria-label", this.getAttribute("label") ?? "Loading...")

    const progress = this.progress
    if (progress === null || Number.isNaN(progress)) {
      this.removeAttribute("aria-valuenow")
    } else {
      this.setAttribute("aria-valuenow", String(progress))
    }
  }
}

// Registered so they upgrade and match `:defined`, but deliberately empty: they
// are the shape of the markup, not behavior. The group labels itself from its
// heading, and the list owns its sizer.
export class CmdkGroupHeadingElement extends HTMLElement {}

export class CmdkListSizerElement extends HTMLElement {}
