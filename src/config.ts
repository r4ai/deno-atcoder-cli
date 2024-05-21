import { defu, fs, path } from "./deps.ts"
import type { Problem, ProblemInfo } from "./api/mod.ts"
import type { DeepRequired } from "./utils.ts"

export const CONFIG_FILE_NAMES = ["ac.config.ts", "ac.config.js"] as const

export type Config = {
  /**
   * コンテストのディレクトリを保存するディレクトリのパス。
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
   * 問題ごとに生成するソースファイル
   */
  source: {
    /**
     * ソースファイルの拡張子を除いたファイル名
     * @argument problem 問題の情報
     * @returns ソースファイルの拡張子を除いたファイル名
     * @default (problem) => problem.id.toLowerCase() // "a", "b", "c", ...
     */
    stem?: string | ((problem: Problem & ProblemInfo) => string)

    /**
     * ソースファイルの拡張子
     * @argument problem 問題の情報
     * @returns ソースファイルの拡張子
     * @default "cpp"
     * @example "py"
     */
    extension?: string | ((problem: Problem & ProblemInfo) => string)

    /**
     * ソースファイルのコンパイルコマンド
     * @argument problem 問題の情報
     * @returns コンパイルコマンド
     * @default (sourcePath: string) => `g++ -std=gnu++20 -Wall -Wextra -O2 -o a.out ${sourcePath}`
     * @see https://img.atcoder.jp/file/language-update/language-list.html
     */
    compileCommand?:
      | string
      | ((sourcePath: string, problem: Problem & ProblemInfo) => string)

    /**
     * ソースファイルの実行コマンド
     * @argument problem 問題の情報
     * @returns 実行コマンド
     * @default "./a.out"
     * @see https://img.atcoder.jp/file/language-update/language-list.html
     */
    executeCommand?:
      | string
      | ((sourcePath: string, problem: Problem & ProblemInfo) => string)

    /**
     * ソースファイルのテンプレート
     * @argument problem 問題の情報
     * @default ""
     * @example
     * ```ts
     * source: "int main() { return 0; }"
     * ```
     */
    template?: string | ((problem: Problem & ProblemInfo) => string)
  }

  /**
   * 問題ごとに生成するその他のファイルたち
   * @argument problem 問題の情報
   * @returns Keyがファイル名、Valueがファイルの中身となるオブジェクト
   */
  templates?:
    | ((problem: Problem & ProblemInfo) => Record<string, string>)
    | Record<string, string>
}

export const defaultConfig: DeepRequired<Config> = {
  contestsDir: "contests",
  source: {
    stem: (problem: Problem & ProblemInfo) => problem.id.toLowerCase(),
    extension: "cpp",
    compileCommand: (sourcePath: string) =>
      `g++ -std=gnu++20 -Wall -Wextra -O2 -o a.out ${sourcePath}`,
    executeCommand: "./a.out",
    template: "",
  },
  templates: {},
}

export const defineConfig = (
  config: Partial<Config>,
): Config => {
  const defaultedConfig = defu(config, defaultConfig)
  defaultedConfig.contestsDir = path.resolve(defaultedConfig.contestsDir)
  return defaultedConfig
}

const getLocalConfig = async (dir: string): Promise<Config> => {
  if (!fs.existsSync(dir) || dir === "/") {
    return defaultConfig
  }

  const configFile = CONFIG_FILE_NAMES.find((name) => fs.existsSync(name))
  if (configFile) {
    const module = await import("file://" + path.resolve(dir, configFile))
    return module.default
  }

  const parentDir = path.dirname(dir)
  return getLocalConfig(parentDir)
}

// deno-lint-ignore no-explicit-any
type Callable<T> = T extends (...args: any[]) => any ? T
  : T extends object ? { [K in keyof T]: Callable<T[K]> }
  : () => T

const callable = <T>(obj: T): Callable<T> => {
  for (const key in obj) {
    switch (typeof obj[key]) {
      case "object": {
        const value = obj[key]
        // deno-lint-ignore ban-ts-comment
        // @ts-expect-error
        obj[key] = callable(value)
        break
      }
      case "function":
        break
      default: {
        const value = obj[key]
        // deno-lint-ignore ban-ts-comment
        // @ts-expect-error
        obj[key] = () => value
        break
      }
    }
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
