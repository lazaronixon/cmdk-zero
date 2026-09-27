globalThis.recordedEvents = {}

function record(name, value) {
  globalThis.recordedEvents[name] ??= []
  globalThis.recordedEvents[name].push(value)
}

document.addEventListener("cmdk:change", event => record("change", event.detail.value))
document.addEventListener("cmdk:search", event => record("search", event.detail.search))
document.addEventListener("cmdk:select", event => record("select", event.detail.value))
