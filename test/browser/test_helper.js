import { test as base } from "@playwright/test"
import { CommandHandle } from "./helpers/command_handle.js"

export const test = base.extend({
  cmdk: async ({ page }, use) => {
    await use(new CommandHandle(page))
  }
})

export { expect } from "@playwright/test"
