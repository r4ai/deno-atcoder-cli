import { fs, path } from "../src/deps.ts"
import { assertSnapshot, beforeAll, describe, it, stub } from "./deps.ts"
import { tree } from "./utils/tree.ts"
import { atcoder } from "../src/cli.ts"
import { serializer } from "./utils/serializer.ts"
import { runAtCoderCli } from "./utils/cli.ts"

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

const LANGUAGES = ["python", "ocaml"] as const
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
}

describe("Tests for atcoder cli", () => {
  beforeAll(setupSampleProjects)

  for (const language of LANGUAGES) {
    it(`snapshot test for ${language} project directory structure`, async (t) => {
      const projectDir = path.resolve(SAMPLE_PROJECTS_DIR, language)
      await Deno.mkdir(projectDir, { recursive: true })

      // Write templates
      // e.g. templates/python/atcoder.config.ts -> sample-projects/python/atcoder.config.ts
      const templates = await getTemplates(language)
      await writeTemplates(templates)

      // Generate contests
      for (const contest of CONTESTS) {
        await runAtCoderCli(
          [
            "gen",
            "--cache-max-age",
            "86400000", // 24 hours
            contest,
          ],
          path.resolve(SAMPLE_PROJECTS_DIR, language),
        )
      }

      const actual = await tree(projectDir)
      await assertSnapshot(t, actual, { serializer })
    })
  }

  it("snapshot test for cli options", async (t) => {
    const projectDir = path.resolve(SAMPLE_PROJECTS_DIR, "cli-options")
    await Deno.mkdir(projectDir, { recursive: true })

    await runAtCoderCli(
      [
        "gen",
        "--config",
        "../../templates/python/atcoder.config.ts",
        "--source.stem",
        "main",
        "--source.extension",
        "atcoder.py",
        "--cache-max-age",
        "86400000", // 24 hours
        "abc300",
      ],
      path.resolve(SAMPLE_PROJECTS_DIR, "cli-options"),
    )

    const actual = await tree(projectDir)
    await assertSnapshot(t, actual, { serializer })
  })
})
