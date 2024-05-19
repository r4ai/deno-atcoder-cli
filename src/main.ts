#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write --allow-env

import { atcoder } from "./cli.ts"

if (import.meta.main) {
  atcoder.parse(Deno.args)
}
