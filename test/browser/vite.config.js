import { defineConfig } from "vite"
import path from "node:path"

export default defineConfig({
  root: path.resolve(import.meta.dirname, "fixtures"),
  // Serves the theme at /cmdk-zero.css, so the fixtures link it as a plain
  // stylesheet exactly the way a real page does.
  publicDir: path.resolve(import.meta.dirname, "../../styles"),
  resolve: {
    alias: {
      "cmdk-zero": path.resolve(import.meta.dirname, "../../src/index.js")
    }
  },
  server: {
    port: parseInt(process.env.VITE_PORT || "5174", 10),
    strictPort: true
  }
})
