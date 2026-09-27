import { describe, expect, test, vi } from "vitest"
import { ListenerBin } from "src/helpers/listener_helper"

describe("ListenerBin", () => {
  test("removes every listener it added on dispose", () => {
    const target = new EventTarget()
    const listener = vi.fn()
    const bin = new ListenerBin()

    bin.listen(target, "ping", listener)
    target.dispatchEvent(new Event("ping"))
    bin.dispose()
    target.dispatchEvent(new Event("ping"))

    expect(listener).toHaveBeenCalledTimes(1)
  })

  test("runs tracked teardowns in reverse order", () => {
    const calls = []
    const bin = new ListenerBin()

    bin.track(() => calls.push("first"))
    bin.track(() => calls.push("second"))
    bin.dispose()

    expect(calls).toEqual([ "second", "first" ])
  })

  test("is empty after disposing, so a second dispose does nothing", () => {
    const teardown = vi.fn()
    const bin = new ListenerBin()

    bin.track(teardown)
    bin.dispose()
    bin.dispose()

    expect(teardown).toHaveBeenCalledTimes(1)
  })
})
