const STYLE_ELEMENT_ID = "cmdk-zero-style"

const PARTS = "cmdk-root, cmdk-list, cmdk-list-sizer, cmdk-group, cmdk-group-heading, cmdk-item, cmdk-separator, cmdk-empty, cmdk-loading"

// These rules are the machinery, and the menu does not work without them. That
// is why they ship with the script instead of with the theme.
//
// - Custom elements are inline by default, and a menu built from inline boxes
//   has no rows to select.
// - Filtering hides a part with the `hidden` attribute rather than removing it,
//   so the DOM you wrote stays yours. The user-agent rule behind `hidden` loses
//   to any `display` in a theme, which would leave every non-match on screen.
// - Items are chosen by pointer, and a press that drags across them would
//   otherwise select their text instead.
// - Scrolling past the end of the list would scroll the page behind it — or
//   behind the dialog it sits in.
const RULES = `
:where(${PARTS}) { display: block; }

:is(${PARTS})[hidden] { display: none !important; }

:where(cmdk-item, cmdk-group-heading) { user-select: none; -webkit-user-select: none; }

:where(cmdk-list) { overscroll-behavior: contain; }
`

// The tag goes first in `head` so everything the page loads — the theme
// included — comes later in the cascade and wins a specificity tie, which is
// why `:where()` keeps the defaults above at zero specificity. The one rule
// that must hold regardless carries `!important`.
export function installStyles(nonce) {
  if (document.getElementById(STYLE_ELEMENT_ID)) return

  const element = document.createElement("style")
  element.id = STYLE_ELEMENT_ID
  if (nonce) element.setAttribute("nonce", nonce)
  element.textContent = RULES

  document.head.prepend(element)
}
