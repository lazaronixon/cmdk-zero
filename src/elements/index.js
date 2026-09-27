import CmdkGroupElement from "./cmdk_group_element"
import CmdkItemElement from "./cmdk_item_element"
import CmdkListElement from "./cmdk_list_element"
import CmdkRootElement from "./cmdk_root_element"
import { CmdkEmptyElement, CmdkGroupHeadingElement, CmdkListSizerElement, CmdkLoadingElement, CmdkSeparatorElement } from "./parts"

const ELEMENTS = {
  // The parts come first so that a menu upgrading in the same pass finds items
  // and groups that already know how to describe themselves.
  "cmdk-list-sizer": CmdkListSizerElement,
  "cmdk-list": CmdkListElement,
  "cmdk-group-heading": CmdkGroupHeadingElement,
  "cmdk-group": CmdkGroupElement,
  "cmdk-item": CmdkItemElement,
  "cmdk-separator": CmdkSeparatorElement,
  "cmdk-empty": CmdkEmptyElement,
  "cmdk-loading": CmdkLoadingElement,

  "cmdk-root": CmdkRootElement
}

// Importing the library calls this for you. Defining a name twice throws, so an
// already-defined one is left alone and calling this more than once is harmless.
export function defineElements() {
  Object.entries(ELEMENTS).forEach(([ name, element ]) => {
    if (!customElements.get(name)) customElements.define(name, element)
  })
}
