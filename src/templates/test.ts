#!/usr/bin/env -S deno run --allow-read

import * as path from "https://deno.land/std@0.213.0/path/mod.ts"

if (import.meta.main) {
  const testsDir = import.meta.dirname
  if (!testsDir) throw new Error("dirname is not defined")

  const problemDir = path.dirname(testsDir)
  const problemId = path.basename(problemDir)
  console.log(problemId)
}
