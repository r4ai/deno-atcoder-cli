import {
  $,
  colors,
  Command,
  CompletionsCommand,
  dedent,
  fs,
  oraPromise,
  path,
} from "./deps.ts"
import { getContests } from "./api/contests.ts"
import { getProblems } from "./api/mod.ts"
import { getProblemInfo } from "./api/problem-info.ts"
import { getConfig } from "./config.ts"
import { getProblemDir, type Metadata, METADATA_FILE_NAME } from "./metadata.ts"

export const atcoder = new Command()
  .name("atcoder")
  .version("0.1.0")
  .description("Utility CLI for AtCoder")
  .command("completions", new CompletionsCommand())

// Generate contest folder and files
atcoder.command("gen")
  .option("-f, --force", "Overwrite existing files")
  .arguments("<contest-id:string:contest-id>")
  .complete("contest-id", async () => {
    const contests = await getContests()
    return contests.map((contest) => contest.id)
  })
  .action(async ({ force }, contestId) => {
    // const spinner = ora(`Generating contest: ${contestId}`).start()
    const config = await getConfig()
    const problems = await oraPromise(getProblems(contestId), {
      text: `Fetching problem list for ${contestId}`,
      successText: `Fetched problem list for ${contestId}`,
      failText: (err) =>
        dedent`
          Failed to fetch problem list for ${contestId}
          ==================================================
          ${err}
        `,
    })

    const contestDir = path.join(config.contestsDir(), contestId)
    if (force && fs.existsSync(contestDir)) {
      await Deno.remove(contestDir, { recursive: true })
    }
    if (fs.existsSync(contestDir)) {
      throw new Error(`Contest directory already exists: ${contestDir}`)
    }

    await Deno.mkdir(contestDir, { recursive: true })
    for (const problemMetaData of problems) {
      const problemInfo = await oraPromise(
        getProblemInfo(
          contestId,
          problemMetaData.id,
          problemMetaData.url,
        ),
        {
          text:
            `Fetching information for ${contestId}/${problemMetaData.id.toUpperCase()}`,
          successText:
            `Fetched information for ${contestId}/${problemMetaData.id.toUpperCase()}`,
          failText: (err) =>
            dedent`
              Failed to fetch information for ${contestId}/${problemMetaData.id.toUpperCase()}
              ==================================================
              ${err}
            `,
        },
      )
      const problem = { ...problemMetaData, ...problemInfo }

      // mkdir abc123/A
      const problemDir = path.resolve(contestDir, problem.id)
      await Deno.mkdir(problemDir, { recursive: true })

      // touch abc123/A/a.cpp
      const filename = `${config.source.stem(problem)}.${
        config.source.extension(problem)
      }`
      const filepath = path.resolve(
        problemDir,
        filename,
      )
      await Deno.writeTextFile(
        filepath,
        config.source.template(problem),
      )

      // touch abc123/A/tests/in_1.txt abc123/A/tests/out_1.txt ...
      const testsDir = path.resolve(problemDir, "tests")
      await Deno.mkdir(testsDir, { recursive: true })
      problem.tests.forEach(async (testCase, i) => {
        await Deno.writeTextFile(
          path.join(testsDir, `in_${i + 1}.txt`),
          testCase.input,
        )
        await Deno.writeTextFile(
          path.join(testsDir, `out_${i + 1}.txt`),
          testCase.output,
        )
      })

      // touch abc123/A/tests/metadata.json
      const metadata: Metadata = {
        contest: contestId,
        problem: problem.id,
        source: {
          path: filename,
          compileCommand: config.source.compileCommand(filename, problem),
          executeCommand: config.source.executeCommand(filename, problem),
        },
        tests: problem.tests.map((_, i) => ({
          input: path.join("tests", `in_${i + 1}.txt`),
          output: path.join("tests", `out_${i + 1}.txt`),
        })),
      }
      await Deno.writeTextFile(
        path.resolve(problemDir, METADATA_FILE_NAME),
        JSON.stringify(metadata, null, 2),
      )

      // touch abc123/A/tests/test.ts
      const testFile = await Deno.readTextFile(
        path.resolve(import.meta.dirname!, "templates", "test.ts"),
      )
      await Deno.writeTextFile(
        path.resolve(testsDir, "test.ts"),
        testFile,
        {
          mode: 0o755,
        }
      )
    }

    console.log(
      [
        "",
        colors.brightGreen.bold(
          ` Successfully generated ${contestId} contest!`,
        ),
        "",
        colors.dim(` Press Enter to continue...`),
      ].join("\n"),
    )
  })

atcoder.command("test")
  .action(async () => {
    await $`deno test --v8-flags="--stack-trace-limit=3" --allow-read --allow-env --allow-run --allow-net`.cwd(
      getProblemDir(Deno.cwd()) ?? Deno.cwd(),
    )
  })
