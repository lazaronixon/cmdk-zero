// Maps a keydown to a menu action, or `null` when the key is not ours.
//
// An IME is still composing when `isComposing` is set, or — in older browsers
// with a CJK IME — when `keyCode` is 229. Acting then would move the selection
// while the user is still picking a character.
export function resolveKeyAction(event, { vimBindings = true } = {}) {
  if (event.defaultPrevented || event.isComposing || event.keyCode === 229) return null

  switch (event.key) {
    case "ArrowDown":
      return forward(event)
    case "ArrowUp":
      return backward(event)
    case "n":
    case "j":
      return vimBindings && event.ctrlKey ? forward(event) : null
    case "p":
    case "k":
      return vimBindings && event.ctrlKey ? backward(event) : null
    case "Home":
      return "first"
    case "End":
      return "last"
    case "Enter":
      return "select"
    default:
      return null
  }
}

function forward(event) {
  if (event.metaKey) return "last"
  if (event.altKey) return "next-group"
  return "next"
}

function backward(event) {
  if (event.metaKey) return "first"
  if (event.altKey) return "previous-group"
  return "previous"
}
