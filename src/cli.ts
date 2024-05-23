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
import { defaultConfig, getConfig, getConfigDir } from "./config.ts"
import { getProblemDir, type Metadata, METADATA_FILE_NAME } from "./metadata.ts"

export const atcoder = new Command()
  .name("atcoder")
  .version("0.1.0")
  .description("Utility CLI for AtCoder")
  .command("completions", new CompletionsCommand())

// Generate contest folder and files
atcoder.command("gen")
  .option("-f, --force", "Overwrite existing files")
  .option("-c, --config <config:file>", "Path to the config file", {
    value: (p) => path.resolve(p),
  })
  .option("--cache-max-age <cache-max-age:number>", "Cache max age [ms]")
  .arguments("<contest-id:string:contest-id>")
  .complete("contest-id", async () => {
    const contests = await getContests(defaultConfig.cacheMaxAge)
    return contests.map((contest) => contest.id)
  })
  .action(async (options, contestId) => {
    const projectDir = options.config
      ? path.dirname(options.config)
      : getConfigDir(Deno.cwd()) ?? Deno.cwd()
    const config = await getConfig(
      {
        cacheMaxAge: options.cacheMaxAge,
      },
      options.config,
    )
    const problems = await oraPromise(
      getProblems(contestId, config.cacheMaxAge()),
      {
        text: `Fetching problem list for ${contestId}`,
        successText: `Fetched problem list for ${contestId}`,
        failText: (err) =>
          dedent`
          Failed to fetch problem list for ${contestId}
          ==================================================
          ${err}
        `,
      },
    )

    const contestsDir = path.isAbsolute(config.contestsDir())
      ? config.contestsDir()
      : path.resolve(projectDir, config.contestsDir())
    const contestDir = path.resolve(contestsDir, contestId)
    if (options.force && fs.existsSync(contestDir)) {
      await Deno.remove(contestDir, { recursive: true })
    }
    if (fs.existsSync(contestDir)) {
      throw new Error(`Contest directory already exists: ${contestDir}`)
    }

    const contest = await oraPromise(
      async () => {
        const contests = await getContests(config.cacheMaxAge())
        const contest = contests.find((contest) => contest.id === contestId)
        if (!contest) throw new Error(`Contest not found: ${contestId}`)
        return contest
      },
      {
        text: `Fetching information for ${contestId}`,
        successText: `Fetched information for ${contestId}`,
        failText: (err) =>
          dedent`
            Failed to fetch information for ${contestId}
            ==================================================
            ${err}
          `,
      },
    )

    await Deno.mkdir(contestDir, { recursive: true })
    for (const problemMetaData of problems) {
      const problemInfo = await oraPromise(
        getProblemInfo(
          contestId,
          problemMetaData.id,
          problemMetaData.url,
          config.cacheMaxAge(),
        ),
        {
          text: `Fetching information for ${contestId}/${problemMetaData.id}`,
          successText:
            `Fetched information for ${contestId}/${problemMetaData.id}`,
          failText: (err) =>
            dedent`
              Failed to fetch information for ${contestId}/${problemMetaData.id}
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
      const filename = `${config.source.stem(problem, contest)}.${
        config.source.extension(problem, contest)
      }`
      const filepath = path.resolve(
        problemDir,
        filename,
      )
      await Deno.writeTextFile(
        filepath,
        config.source.template(problem, contest),
      )

      // touch abc123/A/tests/in_1.txt abc123/A/tests/out_1.txt ...
      const testsDir = path.resolve(problemDir, "tests")
      await Deno.mkdir(testsDir, { recursive: true })
      problem.tests.forEach(async (testCase, i) => {
        await Deno.writeTextFile(
          path.resolve(testsDir, `in_${i + 1}.txt`),
          testCase.input,
        )
        await Deno.writeTextFile(
          path.resolve(testsDir, `out_${i + 1}.txt`),
          testCase.output,
        )
      })

      // touch abc123/A/tests/metadata.json
      const metadata: Metadata = {
        contest: contestId,
        problem: problem.id,
        source: {
          path: filename,
          compileCommand: config.source.compileCommand(
            filename,
            problem,
            contest,
          ),
          executeCommand: config.source.executeCommand(
            filename,
            problem,
            contest,
          ),
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
      const testFile = await (await fetch(
        import.meta.resolve("./templates/test.ts"),
      )).text()
      await Deno.writeTextFile(
        path.resolve(testsDir, "test.ts"),
        testFile,
        {
          mode: 0o755,
        },
      )

      // generate templates configured in `config.templates`
      // touch abc123/A/CMakeLists.txt ...
      for (const template of config.templates(problem, contest)) {
        const filename = typeof template.filename === "function"
          ? template.filename(problem, contest)
          : template.filename
        const filepath = path.isAbsolute(filename)
          ? filename
          : path.resolve(problemDir, filename)
        const content = typeof template.content === "function"
          ? template.content(problem, contest)
          : template.content
        await Deno.writeTextFile(
          filepath,
          content,
        )
      }
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
    await $`deno test --v8-flags="--stack-trace-limit=3" --allow-read --allow-env --allow-run --allow-net`
      .cwd(
        getProblemDir(Deno.cwd()) ?? Deno.cwd(),
      )
  })
