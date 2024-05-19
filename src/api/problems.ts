import { DOMParser, type Element } from "../deps.ts"

export type Problem = {
  /**
   * 問題 ID
   * @example "a", "b", "c"
   */
  id: string

  /**
   * 問題名
   * @example "Product", "Traveling"
   */
  title: string

  /**
   * 問題の URL
   */
  url: URL

  /**
   * 実行時間制限
   * @example "2 sec"
   */
  runTimeLimitation: string

  /**
   * メモリ制限
   * @example "1024 MB"
   */
  memoryLimitation: string
}

export type Problems = Problem[]

type CachedProblems = {
  problems: Problems
  time: number
}

export const getProblems = async (contestId: string) => {
  const cachedProblems = getCachedProblems(contestId)
  if (cachedProblems && Date.now() - cachedProblems.time < 1000 * 3) {
    return cachedProblems.problems
  }

  const problems = await fetchProblems(contestId)
  cacheProblems(contestId, problems)
  return problems
}

export const fetchProblems = async (contestId: string) => {
  const res = await fetch(`https://atcoder.jp/contests/${contestId}/tasks`)
  if (!res.ok) throw new Error("Failed to fetch contest info")

  const html = await res.text()
  const doc = new DOMParser().parseFromString(html, "text/html")
  if (!doc) throw new Error("Failed to parse HTML")

  const problems: Problems = []
  const problemsTableBodyRows = doc.querySelectorAll(
    "#main-container > div.row > div:nth-child(2) > div > table > tbody > tr",
  )
  for (const row of problemsTableBodyRows) {
    const rowElm = row as Element
    const id = rowElm
      .querySelector("td:nth-child(1) > a")
      ?.getAttribute("href")
      ?.split("/")
      .pop()
      ?.split("_")
      .pop()
    const href = rowElm.querySelector("td:nth-child(1) > a")?.getAttribute(
      "href",
    )
    const title = rowElm
      .querySelector("td:nth-child(2) > a")
      ?.textContent?.trim()
    const runTimeLimitation = rowElm
      .querySelector("td:nth-child(3)")
      ?.textContent?.trim()
    const memoryLimitation = rowElm
      .querySelector("td:nth-child(4)")
      ?.textContent?.trim()
    if (!id || !href || !title || !runTimeLimitation || !memoryLimitation) {
      throw new Error("Failed to parse problem. " + rowElm.outerHTML)
    }
    problems.push({
      id,
      url: new URL(href, "https://atcoder.jp"),
      title,
      runTimeLimitation,
      memoryLimitation,
    })
  }

  return problems
}

const cacheProblems = (contestId: string, problems: Problems) => {
  const now = Date.now()
  const cachedProblems: CachedProblems = { problems, time: now }
  localStorage.setItem(`problems-${contestId}`, JSON.stringify(cachedProblems))
}

const getCachedProblems = (contestId: string) => {
  const cachedProblemsData = localStorage.getItem(`problems-${contestId}`)
  if (!cachedProblemsData) return undefined
  const { problems, time }: CachedProblems = JSON.parse(cachedProblemsData)
  return { problems, time }
}

await getProblems("abc200")
await getProblems("abc200")
