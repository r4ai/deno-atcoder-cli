import { DOMParser } from "../deps.ts"
import { sleep } from "../utils.ts"

type Test = {
  /**
   * 入力例（プレーンテキスト）
   * @example
   * ```
   * 3 4
   * 1
   * ```
   */
  input: string

  /**
   * 出力例（プレーンテキスト）
   * @example
   * ```
   * 8
   * ```
   */
  output: string
}

export type ProblemInfo = {
  /**
   * 問題文（HTML）
   */
  problem: string

  /**
   * 制約（HTML）
   */
  constraints: string

  /**
   * 入力に関する説明（HTML）
   */
  input: string

  /**
   * 出力に関する説明（HTML）
   */
  output: string

  /**
   * 入出力例
   */
  tests: Test[]
}

type CachedProblem = {
  problem: ProblemInfo
  time: number
}

export const getProblemInfo = async (
  contestId: string,
  problemId: string,
  problemUrl: URL,
) => {
  const cachedProblemInfo = getCachedProblemInfo(contestId, problemId)
  if (cachedProblemInfo && Date.now() - cachedProblemInfo.time < 1000 * 3) {
    return cachedProblemInfo.problem
  }

  await sleep(1000)
  const problemInfo = await fetchProblemInfo(problemUrl)
  cacheProblemInfo(contestId, problemId, problemInfo)
  return problemInfo
}

const getCachedProblemInfo = (contestId: string, problemId: string) => {
  const cachedProblemInfoData = localStorage.getItem(
    `problem-${contestId}-${problemId}`,
  )
  if (!cachedProblemInfoData) {
    return undefined
  }
  const { problem, time }: CachedProblem = JSON.parse(cachedProblemInfoData)
  return { problem, time }
}

const cacheProblemInfo = (
  contestId: string,
  problemId: string,
  problem: ProblemInfo,
) => {
  const now = Date.now()
  const cachedProblemInfo: CachedProblem = { problem, time: now }
  localStorage.setItem(
    `problem-${contestId}-${problemId}`,
    JSON.stringify(cachedProblemInfo),
  )
}

const fetchProblemInfo = async (
  problemUrl: URL,
) => {
  const res = await fetch(problemUrl)
  if (!res.ok) {
    throw new Error(
      `Failed to fetch problem: ${problemUrl}; ${res.status} ${res.statusText}; ${await res
        .text()}`,
    )
  }
  const contestPage = await res.text()

  const doc = new DOMParser().parseFromString(contestPage, "text/html")!

  const problem = doc.querySelector(
    "#task-statement > span > span.lang-ja > div:nth-child(2)",
  )?.innerHTML
  if (!problem) {
    throw new Error("Failed to parse problem")
  }

  const constraints = doc.querySelector(
    "#task-statement > span > span.lang-ja > div:nth-child(3)",
  )?.innerHTML
  if (!constraints) {
    throw new Error("Failed to parse constraints")
  }

  const input = doc.querySelector(
    "#task-statement > span > span.lang-ja > div.io-style > div:nth-child(1) > section",
  )?.innerHTML
  if (!input) {
    throw new Error("Failed to parse input")
  }

  const output = doc.querySelector(
    "#task-statement > span > span.lang-ja > div.io-style > div:nth-child(2) > section",
  )?.innerHTML
  if (!output) {
    throw new Error("Failed to parse output")
  }

  const tests: Test[] = []
  for (let i = 7; i < 100; i += 3) {
    const input = doc.querySelector(
      `#task-statement > span > span.lang-ja > div:nth-child(${i}) > section > pre`,
    )?.innerText
    const output = doc.querySelector(
      `#task-statement > span > span.lang-ja > div:nth-child(${
        i + 1
      }) > section > pre`,
    )?.innerText
    if (!input || !output) {
      break
    }
    tests.push({ input, output })
  }

  return { problem, constraints, input, output, tests }
}
