#!/usr/bin/env -S deno test --allow-read --allow-env --allow-run

import * as path from "jsr:@std/path@0.225.1"
import { $ } from "jsr:@david/dax@0.41.0"
import { assertEquals } from "jsr:@std/assert@^0.225.2"
import {
  beforeAll,
  describe,
  it,
} from "https://deno.land/std@0.224.0/testing/bdd.ts"
import {
  getMetadata,
  getProblemDir,
  METADATA_FILE_NAME,
} from "jsr:@r4ai/atcoder-cli@0.2.0"

const testsDir = import.meta.dirname!
const problemDir = getProblemDir(testsDir)
if (!problemDir) {
  throw new Error(
    `Failed to get problem directory. Make sure \`${METADATA_FILE_NAME}\` exists.`,
  )
}
const metadata = getMetadata(problemDir)
if (!metadata) {
  throw new Error(
    `Failed to get metadata for ${problemDir}. Make sure \`${METADATA_FILE_NAME}\` exists.`,
  )
}

describe(`${metadata.contest}/${metadata.problem}`, () => {
  beforeAll(async () => {
    // Compile
    await $.raw`${metadata.source.compileCommand}`
  })

  for (const test of metadata.tests) {
    it(test.input, async () => {
      const actual = await $.raw`${metadata.source.executeCommand} < ${
        path.resolve(problemDir, test.input)
      }`.text()
      const expected = await Deno.readTextFile(
        path.resolve(problemDir, test.output),
      )
      assertEquals(
        actual,
        expected,
      )
    })
  }
})
