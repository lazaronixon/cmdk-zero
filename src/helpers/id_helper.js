let counter = 0

// `aria-activedescendant` and `aria-labelledby` point at ids, so every part
// that is referenced needs one. An id you wrote yourself is always kept.
export function ensureId(element, prefix) {
  if (!element.id) element.id = `${prefix}-${++counter}`
  return element.id
}
