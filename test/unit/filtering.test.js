import { computeFiltered, defaultFilter } from "src/menu/filtering"
import { describe, expect, test } from "vitest"

const entries = [
  { key: "apple", value: "Apple", keywords: [], group: "fruit" },
  { key: "banana", value: "Banana", keywords: [ "yellow" ], group: "fruit" },
  { key: "car", value: "Car", keywords: [], group: null },
  { key: "forced", value: "Forced", keywords: [], group: null, forceMount: true }
]

describe("computeFiltered", () => {
  test("counts every item and filters nothing while the search is empty", () => {
    const filtered = computeFiltered({ entries, search: "" })

    expect(filtered.isFiltering).toBe(false)
    expect(filtered.count).toBe(3)
    expect([ ...filtered.items.values() ]).toEqual([ 1, 1, 1 ])
  })

  test("scores items against the search", () => {
    const filtered = computeFiltered({ entries, search: "ap" })

    expect(filtered.isFiltering).toBe(true)
    expect(filtered.count).toBe(1)
    expect(filtered.items.get("apple")).toBeGreaterThan(0)
    expect(filtered.items.get("car")).toBe(0)
  })

  test("matches keywords", () => {
    const filtered = computeFiltered({ entries, search: "yellow" })

    expect(filtered.items.get("banana")).toBeGreaterThan(0)
  })

  test("collects the groups that have a match", () => {
    expect(computeFiltered({ entries, search: "ban" }).groups).toEqual(new Set([ "fruit" ]))
    expect(computeFiltered({ entries, search: "car" }).groups).toEqual(new Set())
  })

  test("never scores or counts a force-mounted item", () => {
    const filtered = computeFiltered({ entries, search: "forced" })

    expect(filtered.items.has("forced")).toBe(false)
    expect(filtered.count).toBe(0)
  })

  test("filters nothing when filtering is turned off", () => {
    const filtered = computeFiltered({ entries, search: "zzz", shouldFilter: false })

    expect(filtered.isFiltering).toBe(false)
    expect(filtered.count).toBe(3)
  })

  test("uses a custom filter", () => {
    const filter = (value, search) => (value.endsWith(search) ? 1 : 0)
    const filtered = computeFiltered({ entries, search: "ar", filter })

    expect(filtered.items.get("car")).toBe(1)
    expect(filtered.items.get("apple")).toBe(0)
  })

  test("scores an item without a value as 0", () => {
    const filtered = computeFiltered({ entries: [ { key: "blank", value: "", keywords: [] } ], search: "a", filter: () => 1 })

    expect(filtered.items.get("blank")).toBe(0)
  })
})

describe("defaultFilter", () => {
  test("is the command score", () => {
    expect(defaultFilter("Apple", "apple")).toBeGreaterThan(0.9)
    expect(defaultFilter("Apple", "z")).toBe(0)
  })
})
