<div align="center">

# cmdk-zero

**Fast, composable, unstyled command menu.**

The accessible, themeable, zero-dependency ⌘K menu for plain HTML — no
framework, no build step required.

</div>

<br />

A vanilla port of [cmdk](https://github.com/pacocoursey/cmdk) by Paco Coursey:
same engine, no React. Ships as a set of custom elements and a CSS-variable
theme.

## Why

A command menu is a combobox that filters and ranks a list as you type. Most
implementations make you hand them an array of objects and a render callback,
and then the interface of those objects grows forever — an icon here, a subtitle
there, a flag to hide one item in one context.

`cmdk-zero` works the other way round. **You write the items as markup**, and the
menu filters, ranks and navigates whatever is there:

- **Composable** — items are plain elements, so wrap them, style them, put icons and shortcuts in them
- **Any source** — static HTML, a server-rendered fragment, your framework, or `append()` from a fetch
- **Fuzzy ranking** — the same `command-score` algorithm as cmdk, best matches first, groups ranked too
- **Keyboard** — arrows, Home/End, ⌘ for first/last, ⌥ for groups, Ctrl+J/K/N/P, Enter; IME-safe
- **Screen readers** — a real `<input>` as a combobox, a listbox, options and `aria-activedescendant`
- **Dialog-ready** — drop it in a native `<dialog>` for the overlay, focus trap and Escape
- **Themeable** — every colour, size and timing is a CSS custom property
- **Zero dependencies** — ~4 KB brotli, no framework

## Add it to a page

Two tags. No build step, no bundler, nothing to install.

```html
<link rel="stylesheet" href="https://esm.sh/cmdk-zero/dist/cmdk-zero.css">
<script type="module" src="https://esm.sh/cmdk-zero"></script>
```

Pin a version for production — `https://esm.sh/cmdk-zero@0.0.1` — so a
release can't change under you.

The script defines the elements and injects the few rules the menu cannot work
without — block layout for the parts, and a `[hidden]` that no theme can
override. That part is machinery, and it is never optional. The theme is the
stylesheet: link it, paste it into a `<style>` tag, or fold it into your own. It
is plain CSS.

The machinery's `<style>` tag goes first in `<head>`, so both the theme and your
own CSS come later in the cascade and win a specificity tie — you never have to
out-specify the defaults to change them.

## Usage

```html
<cmdk-root label="Command Menu">
  <input placeholder="Type a command or search…">

  <cmdk-list>
    <cmdk-empty>No results found.</cmdk-empty>

    <cmdk-group heading="Letters">
      <cmdk-item>a</cmdk-item>
      <cmdk-item>b</cmdk-item>
      <cmdk-separator></cmdk-separator>
      <cmdk-item>c</cmdk-item>
    </cmdk-group>

    <cmdk-item>Apple</cmdk-item>
  </cmdk-list>
</cmdk-root>
```

The first `<input>` inside `<cmdk-root>` becomes the search field; everything
you wrote on it stays. It is optional — without one, the menu is driven from the
keyboard while it has focus.

An item's value is its trimmed text. Give it a `value` when the text is not a
stable, unique name — when it holds a counter, a timestamp, or markup that is
not meant to be matched:

```html
<cmdk-item value="theme" keywords="dark, light, appearance">
  <svg>…</svg> Change theme… <kbd>⌘T</kbd>
</cmdk-item>
```

`keywords` are matched as aliases of the value, and rank with it.

The split is deliberate: attributes you write are bare (`value`, `keywords`,
`disabled`, `heading`), and anything the script writes is `data-*` or ARIA. So a
selector always tells you whether you are matching configuration or state.

Filtering never removes your markup. A part that does not match gets the
`hidden` attribute, and sorting moves the real nodes — so the DOM is always the
source of truth, and selection order is document order.

### Reacting to a choice

```js
const menu = document.querySelector("cmdk-root")

menu.addEventListener("cmdk:select", event => {
  console.log("Chose", event.detail.value, event.target)
})
```

`cmdk:select` fires on the item itself and bubbles, for a click or for Enter.
Listen on the item for one action, or on the menu for all of them.

### In a dialog

A native `<dialog>` already draws the overlay, traps focus, closes on Escape and
honours `autofocus` — so the menu needs nothing more. The theme styles
`dialog:has(> cmdk-root)` so the menu is its only surface, and leaves the
`::backdrop` to your own dialog styles.

```html
<dialog id="menu">
  <cmdk-root label="Global Command Menu">
    <input placeholder="Search…" autofocus>
    <cmdk-list>…</cmdk-list>
  </cmdk-root>
</dialog>
```

```js
const dialog = document.getElementById("menu")

// Toggle the menu when ⌘K is pressed
document.addEventListener("keydown", event => {
  if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
    event.preventDefault()
    dialog.open ? dialog.close() : dialog.showModal()
  }
})

dialog.addEventListener("cmdk:select", () => dialog.close())
```

The menu never listens for ⌘K itself, so you keep full control of the keybind
and its context.

### Nested pages

Selecting one item often opens a more refined set — "Change theme…" leading to
"Dark" and "Light". Swap the items and clear the search:

```js
menu.addEventListener("cmdk:select", event => {
  if (event.detail.value === "theme") {
    menu.list.sizer.replaceChildren(...themeItems)
    menu.search = ""
  }
})

menu.addEventListener("keydown", event => {
  if (event.key === "Escape" || (event.key === "Backspace" && !menu.search)) {
    menu.list.sizer.replaceChildren(...rootItems)
  }
})
```

### Asynchronous results

Append items as they arrive; they are filtered, ranked and selectable the
moment they are in the DOM.

```html
<cmdk-list>
  <cmdk-loading progress="0">Fetching words…</cmdk-loading>
</cmdk-list>
```

```js
const words = await fetch("/dictionary").then(response => response.json())

menu.list.sizer.append(...words.map(word => {
  const item = document.createElement("cmdk-item")
  item.textContent = word
  return item
}))

menu.querySelector("cmdk-loading").remove()
```

### Filtering yourself

Pass `should-filter="false"` to turn off filtering and sorting, and render only
the items that should be visible — handy for server-side search or your own
virtualisation. Or keep the ranking and swap the scorer:

```js
menu.filter = (value, search, keywords) => {
  return value.includes(search) ? 1 : 0
}
```

A filter returns a number between 0 and 1: 0 hides the item, and higher ranks
it first.

## Theming

Every visual decision is a custom property. Set them anywhere — on `:root`, on a
container, or on a single element:

```css
:root {
  --cmdk-radius: 0.5rem;
  --cmdk-item-selected-background: #f4f3ff;
  --cmdk-item-selected-color: #5e5ce6;
}
```

| Property | Default |
| --- | --- |
| `--cmdk-width` | `40rem` |
| `--cmdk-padding` | `0.5rem` |
| `--cmdk-radius` | `0.75rem` |
| `--cmdk-background` | `#ffffff` |
| `--cmdk-border-width` | `1px` |
| `--cmdk-border-color` | `#e2e2e2` |
| `--cmdk-shadow` | `0 16px 70px rgb(0 0 0 / 0.2)` |
| `--cmdk-color` | `#171717` |
| `--cmdk-muted-color` | `#6f6f6f` |
| `--cmdk-font-family` | `system-ui, …` |
| `--cmdk-font-size` | `0.875rem` |
| `--cmdk-input-font-size` | `1.0625rem` |
| `--cmdk-input-padding` | `0.5rem 0.5rem 1rem` |
| `--cmdk-input-gap` | `1rem` |
| `--cmdk-placeholder-color` | `#8f8f8f` |
| `--cmdk-list-height-limit` | `20.625rem` |
| `--cmdk-list-max-height` | `25rem` |
| `--cmdk-item-height` | `3rem` |
| `--cmdk-item-padding` | `0 1rem` |
| `--cmdk-item-gap` | `0.5rem` |
| `--cmdk-item-spacing` | `0.25rem` |
| `--cmdk-item-radius` | `0.5rem` |
| `--cmdk-item-color` | `#6f6f6f` |
| `--cmdk-item-selected-background` | `rgb(0 0 0 / 0.047)` |
| `--cmdk-item-selected-color` | `#171717` |
| `--cmdk-item-active-background` | `#ededed` |
| `--cmdk-item-disabled-color` | `#c7c7c7` |
| `--cmdk-heading-font-size` | `0.75rem` |
| `--cmdk-heading-padding` | `0 0.5rem` |
| `--cmdk-heading-spacing` | `0.5rem` |
| `--cmdk-group-spacing` | `0.5rem` |
| `--cmdk-separator-color` | `#e8e8e8` |
| `--cmdk-separator-spacing` | `0.25rem` |
| `--cmdk-empty-height` | `3rem` |
| `--cmdk-dialog-offset` | `20vh` |
| `--cmdk-transition-duration` | `100ms` |
| `--cmdk-transition-easing` | `ease` |

The defaults reproduce cmdk's Vercel preset — the same sizes, spacing and neutral
gray scale — so a menu looks like the original out of the box.

The theme ships one set of colours and does not react to `prefers-color-scheme`.
Redefine the properties yourself for a dark palette.

The list publishes its content height as `--cmdk-list-height`, which the theme
uses to animate the list as results come and go:

```css
cmdk-list {
  height: min(330px, var(--cmdk-list-height));
  transition: height 100ms ease;
}
```

To scroll an item into view a little before it reaches the edge, give the list
`scroll-padding-block`.

## What it handles for you

The value is the list of things that go wrong when a filtered, ranked list has
to stay usable from the keyboard — and the fix for each:

| | |
| --- | --- |
| Items come from anywhere, at any time | One `MutationObserver` on the menu picks up added, removed and rewritten items, batched into a single pass per task |
| An implicit value goes stale | Text changes inside an item are observed too, so the value is re-derived and re-matched |
| The selected item disappears | Removing or filtering it out moves the selection to the first item left; adding items never steals it |
| A theme's `display` beats `[hidden]` | The machinery re-asserts `display: none !important` on hidden parts |
| Ranking fights your markup | Items are moved inside their own group, together with any wrapper you gave them; ties keep your order |
| The first item of a group scrolls in without its heading | The heading is scrolled into view first |
| An IME is still composing | Keys are ignored while `isComposing` is set, or `keyCode` is 229 in older engines |
| A screen reader loses the selection | Focus that drifts onto the menu is handed back to the input, the only element `aria-activedescendant` works on |
| `height: auto` cannot transition | The list's content height is published as `--cmdk-list-height` |
| Menu properties set before the script loaded | `filter`, `value`, `search` and the rest are picked up on upgrade instead of shadowing the element's own accessors |

## API

### Attributes

On `<cmdk-root>`:

| | |
| --- | --- |
| `label` | accessible name for the search field |
| `value` | the initially selected item's value |
| `should-filter` | `false` turns off filtering and sorting |
| `loop` | arrow keys wrap around at either end |
| `vim-bindings` | `false` turns off Ctrl+J/K/N/P |
| `disable-pointer-selection` | hovering no longer moves the selection |
| `nonce` | applied to the injected `<style>` tag, for CSP `style-src` |

On the parts:

| | |
| --- | --- |
| `<cmdk-item value>` | the item's value, default its trimmed text |
| `<cmdk-item keywords>` | comma-separated aliases matched with the value |
| `<cmdk-item disabled>` | shown, but never selected or chosen |
| `<cmdk-item force-mount>` | shown regardless of the search |
| `<cmdk-group heading>` | generates the group's heading |
| `<cmdk-group value>` | the group's value, default its heading text |
| `<cmdk-group force-mount>` | shown, with all of its items, regardless of the search |
| `<cmdk-separator always-render>` | shown while searching too |
| `<cmdk-list label>` | accessible name for the listbox, default `Suggestions` |
| `<cmdk-loading progress>` | `0`–`100` |
| `<cmdk-loading label>` | accessible name, default `Loading...` |

### Properties

On `<cmdk-root>`:

| | |
| --- | --- |
| `value` | get or set the selected item's value; setting it fires `cmdk:change` |
| `search` | get or set the search; setting it fills the input and filters |
| `filter` | `(value, search, keywords) => number`, replaces the default scorer |
| `filtered` | `{ count, items, groups }` — the visible count, each item's score, and the groups with a match |
| `shouldFilter`, `loop`, `vimBindings`, `disablePointerSelection` | mirror the attributes |
| `input` | the search `<input>`, or `null` |
| `list` | the `<cmdk-list>` |
| `selectedItem` | the selected `<cmdk-item>`, or `null` |

Items have `value`, `keywords` (an array), `disabled` and `forceMount`; groups
have `value`, `heading` and `forceMount`; the list has `sizer`.

### Methods

`focus()`, `blur()`.

### Events

| | |
| --- | --- |
| `cmdk:select` | `detail: { value }` — on the item, bubbles, when it is clicked or chosen with Enter |
| `cmdk:change` | `detail: { value }` — bubbles, whenever the selection moves |
| `cmdk:search` | `detail: { search }` — bubbles, whenever the search changes |

Native `input` events fire from the search field too, and `keydown` on the menu
reaches your listeners — call `preventDefault()` from a listener on the input to
take a key away from the menu.

### Elements

| | |
| --- | --- |
| `<cmdk-root>` | the menu |
| `<input data-cmdk-input>` | the search field — a native input, so it stays an attribute |
| `<cmdk-list>` | the scrolling listbox |
| `<cmdk-list-sizer>` | the list's content, generated for you when you don't write one |
| `<cmdk-item>` | one option |
| `<cmdk-group>` | a group of items |
| `<cmdk-group-heading>` | the group's label, generated from `heading` or written by you |
| `<cmdk-separator>` | a divider between items or groups |
| `<cmdk-empty>` | shown when nothing matches |
| `<cmdk-loading>` | a progress bar for asynchronous items |

### State attributes

Written by the script, never by you.

On an item: `data-selected`, `data-disabled`, `data-value`, `aria-selected`,
`aria-disabled`. On a group: `data-value`. On any part filtered out: `hidden`.

## Development

```bash
npm install
npm run build            # dist/ — esm, minified, gzip and brotli, plus the CSS
npm run lint             # eslint, JS and CSS
npm test                 # vitest, jsdom
npm run test:browser     # playwright, chromium + firefox + webkit
npm run playground       # the fixture pages, as a live playground
```

Tests come in two layers. **Vitest** (`test/unit/`) covers the pure logic and
the elements' own contract in jsdom. **Playwright** (`test/browser/`) drives real
browsers for everything that only a browser can tell you: typing, keyboard
navigation, pointer selection, scrolling, dialogs and theming.

Every one of cmdk's own browser tests is ported under its original title and
`describe` block, so the two suites can be compared line by line; the tests
cmdk-zero adds live in `cmdk-zero` blocks beside them. The one upstream page
without a counterpart is a list portalled out of the menu: items are found
inside `<cmdk-root>`, so the list has to stay inside it too.

## Credits

A port of [cmdk](https://github.com/pacocoursey/cmdk) by Paco Coursey — the
composable API, the ranking and every behaviour here were designed there first.
The scorer is a port of [command-score](https://github.com/superhuman/command-score)
by Superhuman.

## License

MIT
