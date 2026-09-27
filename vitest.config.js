import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
  resolve: {
    alias: {
      "cmdk-zero": path.resolve(import.meta.dirname, "src/index.js"),
      src: path.resolve(import.meta.dirname, "src")
    }
  },
  test: {
    environment: "jsdom",
    include: [ "test/unit/**/*.test.js" ],
    exclude: [ "**/browser/**", "**/node_modules/**" ],
    coverage: {
      include: [ "src/**" ],
      reporter: [ "text", "html" ],
      reportsDirectory: "coverage"
    }
  }
})
