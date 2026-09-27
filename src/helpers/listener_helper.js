export class ListenerBin {
  #teardowns = []

  listen(target, type, listener, options) {
    target.addEventListener(type, listener, options)
    this.track(() => target.removeEventListener(type, listener, options))
  }

  track(teardown) {
    this.#teardowns.push(teardown)
  }

  dispose() {
    while (this.#teardowns.length) {
      const teardown = this.#teardowns.pop()
      teardown()
    }
  }
}
