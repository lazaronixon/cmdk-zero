export function findNextSibling(element, selector) {
  let sibling = element.nextElementSibling

  while (sibling) {
    if (sibling.matches(selector)) return sibling
    sibling = sibling.nextElementSibling
  }

  return null
}

export function findPreviousSibling(element, selector) {
  let sibling = element.previousElementSibling

  while (sibling) {
    if (sibling.matches(selector)) return sibling
    sibling = sibling.previousElementSibling
  }

  return null
}

// The ancestor of `node` — or `node` itself — that sits directly inside
// `container`, so an item wrapped in markup of your own moves with its wrapper.
export function childOf(container, node) {
  let current = node

  while (current && current.parentElement !== container) {
    current = current.parentElement
  }

  return current
}
