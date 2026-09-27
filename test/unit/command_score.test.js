import { describe, expect, test } from "vitest"
import { commandScore } from "src/menu/command_score"

describe("commandScore", () => {
  test("an exact match scores 1", () => {
    expect(commandScore("apple", "apple")).toBe(1)
  })

  test("a string that does not contain the abbreviation scores 0", () => {
    expect(commandScore("apple", "z")).toBe(0)
  })

  test("an empty abbreviation matches everything, slightly below a full match", () => {
    expect(commandScore("apple", "")).toBeCloseTo(0.99)
  })

  test("a prefix beats a longer string with the same prefix", () => {
    expect(commandScore("html", "html")).toBeGreaterThan(commandScore("html5", "html"))
  })

  test("a word start beats a match in the middle of a word", () => {
    expect(commandScore("open file", "f")).toBeGreaterThan(commandScore("often", "f"))
  })

  test("a space-separated word start beats a slash-separated one", () => {
    expect(commandScore("a b", "b")).toBeGreaterThan(commandScore("a/b", "b"))
  })

  // Past the first match, each word skipped on the way to the next one costs a
  // little, whether the words are split by symbols or by spaces.
  test("skipping more words after a match scores lower", () => {
    expect(commandScore("a/c", "ac")).toBeGreaterThan(commandScore("a/b/c", "ac"))
    expect(commandScore("a c", "ac")).toBeGreaterThan(commandScore("a b c", "ac"))
  })

  test("fewer skipped characters score higher", () => {
    expect(commandScore("bad", "bd")).toBeGreaterThan(commandScore("bard", "bd"))
  })

  test("an exact-case match beats a case-insensitive one", () => {
    expect(commandScore("HTML", "HM")).toBeGreaterThan(commandScore("haml", "HM"))
  })

  test("a transposition is penalized but still matches", () => {
    const score = commandScore("ouch", "uoch")

    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThan(commandScore("ouch", "ouch"))
  })

  test("repeated letters in the abbreviation still match", () => {
    expect(commandScore("mmm", "mm")).toBeGreaterThan(0)
  })

  // Only the exact-character penalty separates them from a perfect match.
  test("every kind of space matches every other", () => {
    expect(commandScore("foo-bar", "foo bar")).toBeCloseTo(1, 3)
    expect(commandScore("foo\tbar", "foo bar")).toBeCloseTo(1, 3)
  })

  test("aliases are matched as part of the string", () => {
    expect(commandScore("Item", "key")).toBe(0)
    expect(commandScore("Item", "key", [ "key" ])).toBeGreaterThan(0)
  })

  test("digits are matched like any other character", () => {
    expect(commandScore("foo.bar112.value", "112")).toBeGreaterThan(0)
    expect(commandScore("removed", "112")).toBe(0)
  })
})
