import { defineConfig } from "jsr:@r4ai/atcoder-cli@0.3.1"

export default defineConfig({
  source: {
    extension: "py",
    compileCommand: (source) => `python3 -m py_compile ${source}`,
    executeCommand: (source) => `python3 ${source}`,
  },
})
