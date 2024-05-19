import { Command, CompletionsCommand } from "@cliffy/command"
import * as fs from "@std/fs"
import * as path from "@std/path"
import { getContests } from "./api/contests.ts"
import { getProblems } from "./api/mod.ts"
import { getProblemInfo } from "./api/problem-info.ts"
import { getConfig } from "./config.ts"
import { oraPromise } from "ora"
import dedent from "dedent"
import { colors } from "@cliffy/ansi"

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
      const problemDir = path.join(contestDir, problem.id)
      await Deno.mkdir(problemDir, { recursive: true })

      // touch abc123/A/a.cpp
      const file = path.join(
        problemDir,
        `${config.source.stem?.(problem)}.${
          config.source.extension?.(problem)
        }`,
      )
      await Deno.writeTextFile(
        file,
        config.source.template?.(problem) ?? "",
      )

      // touch abc123/A/in_1.txt abc123/A/out_1.txt ...
      const testsDir = path.join(problemDir, "tests")
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
    }

    console.log(
      [
        "",
        colors.brightGreen.bold(` Successfully generated ${contestId} contest!`),
        "",
        colors.dim(` Press Enter to continue...`),
      ].join("\n"),
    )
  })
