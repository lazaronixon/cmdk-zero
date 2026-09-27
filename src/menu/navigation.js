import { findNextSibling, findPreviousSibling } from "../helpers/dom_helper"

const GROUP_TAG = "cmdk-group"
const HEADING_TAG = "cmdk-group-heading"

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
// above it.
export function scrollItemIntoView(item, items) {
  const group = item.closest(GROUP_TAG)
  const isFirstInGroup = group && items.find(candidate => group.contains(candidate)) === item

  if (isFirstInGroup) group.querySelector(HEADING_TAG)?.scrollIntoView({ block: "nearest" })
  item.scrollIntoView({ block: "nearest" })
}
