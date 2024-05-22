import { defu, fs, path } from "./deps.ts"
import type { Problem, ProblemInfo } from "./api/mod.ts"
import type { DeepRequired } from "./utils.ts"
import type { Contest } from "./main.ts"

export const CONFIG_FILE_NAMES = [
  "atcoder.config.ts",
  "atcoder.config.js",
] as const

export type Template = {
  /**
   * ファイル名
   * @argument problem 問題の情報（例：A問題の情報）
   * @argument contest コンテストの情報（例：abc123の情報）
   * @returns ファイル名
   */
  filename:
    | string
    | ((problem: Problem & ProblemInfo, contest: Contest) => string)

  /**
   * ファイルの内容
   * @argument problem 問題の情報（例：A問題の情報）
   * @argument contest コンテストの情報（例：abc123の情報）
   * @returns ファイルの内容
   */
  content:
    | string
    | ((problem: Problem & ProblemInfo, contest: Contest) => string)
}

export type Config = {
  /**
   * コンテストのディレクトリを保存するディレクトリのパス
   * @default "contests"
   * @example
   * ```
   * $ tree .
   * .
   * └── contests
   *     └── abc123
   *         ├── a
   *         │   ├── a.cpp
   *         │   └── tests
   *         │       ├── in_1.txt
   *         │       ├── out_1.txt
   *         │       ├── in_2.txt
   *         │       └── out_2.txt
   *         ├── b
   *         │   ├── b.cpp
   *         │   └── tests
   *         ├── c
   *         │   ├── c.cpp
   *         │   └── tests
   *         └── d
   *             ├── d.cpp
   *             └── tests
   * ```
   */
  contestsDir: string

  /**
   * 各問題のディレクトリの名前
   * @argument problem 問題の情報
   * @argument contest コンテストの情報
   * @returns 問題を保存するディレクトリの名前
   * @default (problem: Problem & ProblemInfo) => problem.id
   * @example "A", "B", "C", "Ex", ...
   */
  problemDir:
    | string
    | ((problem: Problem & ProblemInfo, contest: Contest) => string)

  /**
   * 問題ごとに生成するソースファイル
   */
  source: {
    /**
     * ソースファイルの拡張子を除いたファイル名
     * @argument problem 問題の情報
     * @argument contest コンテストの情報
     * @returns ソースファイルの拡張子を除いたファイル名
     * @default (problem) => problem.id.toLowerCase() // "a", "b", "c", ...
     */
    stem?:
      | string
      | ((problem: Problem & ProblemInfo, contest: Contest) => string)

    /**
     * ソースファイルの拡張子
     * @argument problem 問題の情報
     * @argument contest コンテストの情報
     * @returns ソースファイルの拡張子
     * @default "cpp"
     * @example "py"
     */
    extension?:
      | string
      | ((problem: Problem & ProblemInfo, contest: Contest) => string)

    /**
     * ソースファイルのコンパイルコマンド
     * @argument sourcePath 問題ディレクトリから見たソースファイルの相対パス（例：a.cpp）
     * @argument problem 問題の情報
     * @argument contest コンテストの情報
     * @returns コンパイルコマンド
     * @default (sourcePath: string) => `g++ -std=gnu++20 -Wall -Wextra -O2 -o a.out ${sourcePath}`
     * @see https://img.atcoder.jp/file/language-update/language-list.html
     */
    compileCommand?:
      | string
      | ((
        sourcePath: string,
        problem: Problem & ProblemInfo,
        contest: Contest,
      ) => string)

    /**
     * ソースファイルの実行コマンド
     * @argument sourcePath 問題ディレクトリから見たソースファイルの相対パス（例：a.cpp）
     * @argument problem 問題の情報
     * @argument contest コンテストの情報
     * @returns 実行コマンド
     * @default "./a.out"
     * @see https://img.atcoder.jp/file/language-update/language-list.html
     */
    executeCommand?:
      | string
      | ((
        sourcePath: string,
        problem: Problem & ProblemInfo,
        contest: Contest,
      ) => string)

    /**
     * ソースファイルのテンプレート
     * @argument problem 問題の情報
     * @argument contest コンテストの情報
     * @returns ソースファイルの内容
     * @default ""
     * @example "int main() { return 0; }"
     */
    template?:
      | string
      | ((problem: Problem & ProblemInfo, contest: Contest) => string)
  }

  /**
   * 問題ごとに生成するその他のファイルたち
   * @argument problem 問題の情報
   * @argument contest コンテストの情報
   * @returns テンプレートたち
   * @default []
   * @example
   * ```
   * [
   *   {
   *     filename: "CMakeLists.txt",
   *     content: "cmake_minimum_required(VERSION 3.20)",
   *   },
   * ]
   * ```
   */
  templates?:
    | Template[]
    | ((problem: Problem & ProblemInfo, contest: Contest) => Template[])
}

export const defaultConfig: DeepRequired<Config> = {
  contestsDir: "contests",
  problemDir: (problem: Problem & ProblemInfo) => problem.id,
  source: {
    stem: (problem: Problem & ProblemInfo) => problem.id.toLowerCase(),
    extension: "cpp",
    compileCommand: (sourcePath: string) =>
      `g++ -std=gnu++20 -Wall -Wextra -O2 -o a.out ${sourcePath}`,
    executeCommand: "./a.out",
    template: "",
  },
  templates: [],
}

export const defineConfig = (
  config: Partial<Config>,
): Config => {
  const defaultedConfig = defu(config, defaultConfig)
  defaultedConfig.contestsDir = path.resolve(defaultedConfig.contestsDir)
  return defaultedConfig
}

const getLocalConfig = async (dir: string): Promise<Config> => {
  if (!fs.existsSync(dir)) {
    return defaultConfig
  }

  const configFile = CONFIG_FILE_NAMES.find((name) => fs.existsSync(name))
  if (configFile) {
    const module = await import("file://" + path.resolve(dir, configFile))
    return module.default
  }

  const parentDir = path.dirname(dir)
  if (parentDir === dir) {
    return defaultConfig
  }
  return getLocalConfig(parentDir)
}

export const getConfigDir = (dir: string): string | undefined => {
  if (!fs.existsSync(dir)) {
    return undefined
  }

  const configFile = CONFIG_FILE_NAMES.find((name) => fs.existsSync(name))
  if (configFile) {
    return dir
  }

  const parentDir = path.dirname(dir)
  if (parentDir === dir) {
    return undefined
  }
  return getConfigDir(parentDir)
}

// deno-lint-ignore no-explicit-any
type Callable<T> = T extends (...args: any[]) => any ? T
  : T extends Array<unknown> ? () => T
  : T extends object ? { [K in keyof T]: Callable<T[K]> }
  : () => T

const callable = <T>(obj: T): Callable<T> => {
  for (const key in obj) {
    if (typeof obj[key] === "function") {
      continue
    }
    if (Array.isArray(obj[key])) {
      const value = obj[key]
      // deno-lint-ignore ban-ts-comment
      // @ts-expect-error
      obj[key] = () => value
      continue
    }
    if (typeof obj[key] === "object") {
      const value = obj[key]
      // deno-lint-ignore ban-ts-comment
      // @ts-expect-error
      obj[key] = callable(value)
      continue
    }
    const value = obj[key]
    // deno-lint-ignore ban-ts-comment
    // @ts-expect-error
    obj[key] = () => value
  }
  return obj as Callable<T>
}

export const getConfig = async (
  config?: Partial<Config>,
): Promise<Callable<DeepRequired<Config>>> => {
  const localConfig = await getLocalConfig(Deno.cwd())
  const mergedConfig = defu(config, localConfig, defaultConfig)
  return callable(mergedConfig)
}
