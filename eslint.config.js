import { defineConfig } from "eslint/config"
import compat from "eslint-plugin-compat"
import css from "@eslint/css"
import globals from "globals"
import js from "@eslint/js"

export default defineConfig([
  {
    ignores: [ "coverage/**", "dist/**", "node_modules/**", "test/browser/playwright-report/**", "test/browser/test-results/**" ]
  },
  {
    files: [ "styles/**/*.css" ],
    language: "css/css",
    plugins: { css },
    extends: [ "css/recommended" ],
    rules: {
      "css/use-baseline": [ "warn", { available: 2023 } ],
      "css/no-invalid-properties": [ "error", { allowUnknownVariables: true } ]
    }
  },
  {
    files: [ "src/**/*.js" ],
    plugins: { js, compat },
    extends: [ "js/recommended" ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.browser
    },
    rules: {
      "compat/compat": [ "error" ],

      "array-bracket-spacing": [ "error", "always" ],
      "block-spacing": [ "error", "always" ],
      "camelcase": [ "error" ],
      "comma-spacing": [ "error" ],
      "curly": [ "error", "multi-line" ],
      "dot-notation": [ "error" ],
      "eol-last": [ "error" ],
      "func-style": [ "error", "declaration" ],
      "getter-return": [ "error" ],
      "keyword-spacing": [ "error" ],
      "no-empty": "off",
      "no-multi-spaces": [ "error", { "exceptions": { "VariableDeclarator": true } } ],
      "no-multiple-empty-lines": [ "error", { "max": 2 } ],
      "no-restricted-globals": [ "error", "event" ],
      "no-trailing-spaces": [ "error" ],
      "no-unused-vars": [ "error", { "vars": "all", "args": "none", "caughtErrors": "none" } ],
      "no-var": [ "error" ],
      "object-curly-spacing": [ "error", "always" ],
      "prefer-const": [ "error" ],
      "quotes": [ "error", "double" ],
      "semi": [ "error", "never" ],
      "sort-imports": [ "error", { "ignoreDeclarationSort": true } ]
    }
  },
  {
    files: [ "test/**/*.js", "*.config.js", "*.config.mjs" ],
    plugins: { js },
    extends: [ "js/recommended" ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node }
    },
    rules: {
      "quotes": [ "error", "double" ],
      "semi": [ "error", "never" ],
      "no-unused-vars": [ "error", { "vars": "all", "args": "none", "caughtErrors": "none" } ]
    }
  }
])
