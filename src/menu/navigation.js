import { findNextSibling, findPreviousSibling } from "../helpers/dom_helper"

const GROUP_TAG = "cmdk-group"
const HEADING_TAG = "cmdk-group-heading"
const ITEM_TAG = "cmdk-item"

// The item one step away from `current` among `items`, which are in DOM order.
// With nothing selected, stepping forward lands on the first item.
export function adjacentItem(items, current, change, { loop = false } = {}) {
  const index = items.indexOf(current)
  const target = index + change

  if (loop) {
    if (target < 0) return items.at(-1) ?? null
    if (target >= items.length) return items[0] ?? null
  }

  return items[target] ?? null
}

// The first item of the next (or previous) group that has one. Outside a group,
// or past the last one, this falls back to stepping by a single item.
export function adjacentGroupItem(items, current, change, options) {
  let group = current?.closest(GROUP_TAG)
  let item = null

  while (group && !item) {
    group = change > 0 ? findNextSibling(group, GROUP_TAG) : findPreviousSibling(group, GROUP_TAG)
    item = items.find(candidate => group?.contains(candidate)) ?? null
  }

  return item ?? adjacentItem(items, current, change, options)
}

// The first item of a group would otherwise scroll in with its heading cut off
// above it. "First" is cmdk's check: the first item the group renders, disabled
// or not. cmdk unmounts the items a search filters out; here they are hidden.
//
// With a `container`, only that box scrolls. That is for a selection the menu
// made on its own — on load, or as items come and go — which must not drag the
// page to a menu below the fold. A selection the user moved scrolls whatever it
// takes, the way `scrollIntoView` does.
export function scrollItemIntoView(item, { container = null } = {}) {
  const group = item.closest(GROUP_TAG)
  const isFirstInGroup = group?.querySelector(`${ITEM_TAG}:not([hidden])`) === item
  const targets = [ isFirstInGroup ? group.querySelector(HEADING_TAG) : null, item ].filter(Boolean)

  targets.forEach(target => {
    if (container) {
      scrollWithin(container, target)
    } else {
      target.scrollIntoView({ block: "nearest" })
    }
  })
}

// Scrolls `container` just enough for `element` to be inside its visible box,
// the way `block: "nearest"` would, without touching any other scroller.
export function scrollWithin(container, element) {
  const top = container.getBoundingClientRect().top + container.clientTop
  const bottom = top + container.clientHeight
  const rect = element.getBoundingClientRect()

  if (rect.bottom > bottom) {
    container.scrollTop += rect.bottom - bottom
  } else if (rect.top < top) {
    container.scrollTop -= top - rect.top
  }
}
