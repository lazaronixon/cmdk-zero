import { commandScore } from "./command_score"

export function defaultFilter(value, search, keywords) {
  return commandScore(value, search, keywords)
}

// Scores every entry against the search. An entry is `{ key, value, keywords,
// group, forceMount }`; the key and the group are opaque, so this runs the same
// over elements or plain objects.
//
// A force-mounted entry is always shown and never counted, so an `Empty` next
// to it still appears when nothing else matches.
export function computeFiltered({ entries, search, shouldFilter = true, filter = defaultFilter }) {
  const isFiltering = search !== "" && shouldFilter
  const items = new Map()
  const groups = new Set()
  let count = 0

  entries.forEach(({ key, value, keywords, group, forceMount }) => {
    if (forceMount) return

    let score = 1
    if (isFiltering) score = value ? filter(value, search, keywords) : 0

    items.set(key, score)
    if (score > 0) {
      count++
      if (group) groups.add(group)
    }
  })

  return { isFiltering, count, items, groups }
}
