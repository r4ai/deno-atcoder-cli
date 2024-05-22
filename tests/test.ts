import { $, fs, path } from "../src/deps.ts"
import { afterAll, assertSnapshot, beforeAll, describe, it } from "./deps.ts"
import { tree } from "./utils/tree.ts"

const dirname = import.meta.dirname
if (!dirname) {
  throw new Error("please run locally with `deno test`")
}

const SAMPLE_PROJECT_DIR = path.resolve(dirname, "sample-projects")
const TEMPLATES_DIR = path.resolve(dirname, "templates")

const LANGUAGES = ["python"] as const
const CONTESTS = ["abc100"] as const

const getConfig = (language: (typeof LANGUAGES)[number]) => {
  switch (language) {
    case "python":
      return Deno.readTextFile(
        path.resolve(TEMPLATES_DIR, "python", "atcoder.config.ts"),
      )
  }
}

const setupSampleProjects = async () => {
  if (fs.existsSync(SAMPLE_PROJECT_DIR)) {
    await Deno.remove(SAMPLE_PROJECT_DIR, { recursive: true })
  }
  for (const language of LANGUAGES) {
    const projectDir = path.resolve(SAMPLE_PROJECT_DIR, language)
    await Deno.mkdir(projectDir, { recursive: true })

    // Write atcoder.config.ts
    const config = await getConfig(language)
    await Deno.writeTextFile(
      path.resolve(projectDir, "atcoder.config.ts"),
      config,
    )

    // Generate contests
    for (const contest of CONTESTS) {
      await $`deno run -A ../../../src/main.ts gen ${contest}`.cwd(projectDir)
    }
  }
}

const cleanUpSampleProjects = async () => {
  if (fs.existsSync(SAMPLE_PROJECT_DIR)) {
    await Deno.remove(SAMPLE_PROJECT_DIR, { recursive: true })
  }
}

describe("Tests for atcoder cli", () => {
  beforeAll(setupSampleProjects)

  afterAll(cleanUpSampleProjects)

  for (const language of LANGUAGES) {
    it(`snapshot test for ${language} project directory structure`, async (t) => {
      const projectDir = path.resolve(SAMPLE_PROJECT_DIR, language)
      const actual = await tree(projectDir)
      await assertSnapshot(t, actual, {
        serializer: (v) =>
          Deno.inspect(v, {
            depth: Infinity,
            iterableLimit: Infinity,
            strAbbreviateSize: Infinity,
          }),
      })
    })
  }
})
