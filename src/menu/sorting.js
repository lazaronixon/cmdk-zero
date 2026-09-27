import { childOf } from "../helpers/dom_helper"

const CONTAINER_SELECTOR = "cmdk-group, cmdk-list-sizer"

// Sorting moves the real nodes, because the DOM is what the keyboard walks:
// selection order is document order. Each item is re-appended inside its own
// group — or the list, when it has none — best score first, and it takes any
// wrapper of yours along with it. `Array#sort` is stable, so ties keep the
// order you wrote.
export function sortItems(items, scores) {
  [ ...items ]
    .sort((a, b) => (scores.get(b) ?? 0) - (scores.get(a) ?? 0))
    .forEach(item => {
      const container = item.parentElement?.closest(CONTAINER_SELECTOR)
      const node = container && childOf(container, item)
      if (node) container.appendChild(node)
    })
}

// Groups follow, ranked by their best item. Appending them after the loose
// items is what keeps ungrouped matches at the top.
export function sortGroups(groups, scores, itemsOf) {
  [ ...groups ]
    .map(group => [ group, Math.max(0, ...itemsOf(group).map(item => scores.get(item) ?? 0)) ])
    .sort((a, b) => b[1] - a[1])
    .forEach(([ group ]) => group.parentElement?.appendChild(group))
}

// Sorting leaves the nodes where it moved them, so the order you wrote is
// recorded when a search starts and put back when it ends. Otherwise the
// groups would stay ranked, with separators stranded between the wrong ones.
export function recordOrder(containers) {
  return new Map(containers.map(container => [ container, Array.from(container.childNodes) ]))
}

// Nodes removed since are skipped, and nodes added since keep their current
// order after the ones that were recorded.
export function restoreOrder(order) {
  order.forEach((nodes, container) => {
    const recorded = new Set(nodes)
    const added = Array.from(container.childNodes).filter(node => !recorded.has(node))

    container.append(...nodes.filter(node => node.parentNode === container), ...added)
  })
}
