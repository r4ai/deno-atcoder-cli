import { $, fs, path } from "../src/deps.ts"
import { afterAll, assertSnapshot, beforeAll, describe, it } from "./deps.ts"
import { tree } from "./utils/tree.ts"

type Template = {
  filepath: string
  content: string
}

const dirname = import.meta.dirname
if (!dirname) {
  throw new Error("please run locally with `deno test`")
}

const SAMPLE_PROJECTS_DIR = path.resolve(dirname, "sample-projects")
const TEMPLATES_DIR = path.resolve(dirname, "templates")

const LANGUAGES = ["python"] as const
const CONTESTS = ["abc100"] as const

const getTemplates = async (
  language: (typeof LANGUAGES)[number],
  dir = path.resolve(TEMPLATES_DIR, language),
): Promise<Template[]> => {
  const templateDir = path.resolve(TEMPLATES_DIR, language)
  const sampleProjectDir = path.resolve(SAMPLE_PROJECTS_DIR, language)

  const templates = Deno.readDir(dir)
  const result: Template[] = []
  for await (const template of templates) {
    const templatePath = path.resolve(dir, template.name)
    if (template.isFile) {
      const filepath = path.resolve(
        sampleProjectDir,
        path.relative(templateDir, templatePath),
      )
      const content = await Deno.readTextFile(templatePath)
      result.push({ filepath, content })
      continue
    }
    if (template.isDirectory) {
      const subTemplates = await getTemplates(language, templatePath)
      result.push(...subTemplates)
      continue
    }
  }
  return result
}

const writeTemplates = async (templates: Template[]) => {
  const writing = []
  for (const template of templates) {
    writing.push(Deno.writeTextFile(template.filepath, template.content))
  }
  await Promise.all(writing)
}

const setupSampleProjects = async () => {
  if (fs.existsSync(SAMPLE_PROJECTS_DIR)) {
    await Deno.remove(SAMPLE_PROJECTS_DIR, { recursive: true })
  }
  for (const language of LANGUAGES) {
    const projectDir = path.resolve(SAMPLE_PROJECTS_DIR, language)
    await Deno.mkdir(projectDir, { recursive: true })

    // Write templates
    // e.g. templates/python/atcoder.config.ts -> sample-projects/python/atcoder.config.ts
    const templates = await getTemplates(language)
    await writeTemplates(templates)

    // Generate contests
    for (const contest of CONTESTS) {
      await $`deno run -A ../../../src/main.ts gen ${contest}`.cwd(projectDir)
    }
  }
}

const cleanUpSampleProjects = async () => {
  if (fs.existsSync(SAMPLE_PROJECTS_DIR)) {
    await Deno.remove(SAMPLE_PROJECTS_DIR, { recursive: true })
  }
}

describe("Tests for atcoder cli", () => {
  beforeAll(setupSampleProjects)

  afterAll(cleanUpSampleProjects)

  for (const language of LANGUAGES) {
    it(`snapshot test for ${language} project directory structure`, async (t) => {
      const projectDir = path.resolve(SAMPLE_PROJECTS_DIR, language)
      const actual = await tree(projectDir)
      await assertSnapshot(t, actual, {
        serializer: (v) =>
          Deno.inspect(v, {
            sorted: true,
            depth: Infinity,
            iterableLimit: Infinity,
            strAbbreviateSize: Infinity,
          }),
      })
    })
  }
})
