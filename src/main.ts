#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write --allow-env

import { atcoder } from "./cli.ts"

export { type Config, defineConfig, getConfig } from "./config.ts"

if (import.meta.main) {
  atcoder.parse(Deno.args)
}
