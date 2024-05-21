#!/usr/bin/env -S deno test --allow-read --allow-env --allow-run --allow-net

import * as path from "jsr:@std/path@0.225.1"
import { $ } from "jsr:@david/dax@0.41.0"
import { assertEquals } from "jsr:@std/assert@^0.225.2"
import { beforeAll, describe, it } from "jsr:@std/testing/bdd"
import {
  getMetadata,
  getProblemDir,
  METADATA_FILE_NAME,
} from "jsr:@r4ai/atcoder-cli@0.2.3"

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
    await $.raw`${metadata.source.compileCommand}`.cwd(problemDir)
  })

  for (const test of metadata.tests) {
    it(test.input, async () => {
      const input = (await Deno.readTextFile(
        path.resolve(problemDir, test.input),
      )).trimEnd()
      const expected = (await Deno.readTextFile(
        path.resolve(problemDir, test.output),
      )).trimEnd()
      const actual = await $.raw`${metadata.source.executeCommand}`.stdinText(
        input,
      ).cwd(problemDir).text()
      assertEquals(
        actual,
        expected,
      )
    })
  }
})
