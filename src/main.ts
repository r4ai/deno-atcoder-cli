#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write --allow-env

import { atcoder } from "./cli.ts"

export {
  type Config,
  CONFIG_FILE_NAMES,
  defaultConfig,
  defineConfig,
  getConfig,
} from "./config.ts"
export {
  getMetadata,
  getProblemDir,
  type Metadata,
  METADATA_FILE_NAME,
} from "./metadata.ts"

if (import.meta.main) {
  atcoder.parse(Deno.args)
}
