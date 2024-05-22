import { defineConfig } from "../../../src/main.ts"

export default defineConfig({
  source: {
    extension: "py",
    compileCommand: (source) => `python3 -m py_compile ${source}`,
    executeCommand: (source) => `python3 ${source}`,
  },
})
