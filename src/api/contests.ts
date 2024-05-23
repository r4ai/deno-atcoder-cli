export type Contest = {
  id: string
  start_epoch_second: number
  duration_second: number
  title: string
  rate_change: string
}

export type Contests = Contest[]

type CachedContests = {
  contests: Contests
  time: number
}

export const getContests = async (
  cacheMaxAge: number,
): Promise<Contests> => {
  const cachedContests = getCachedContests()
  if (cachedContests && Date.now() - cachedContests.time < cacheMaxAge) {
    return cachedContests.contests
  }

  const contests = await fetchContests()
  cacheContests(contests)
  return contests
}

const fetchContests = async (): Promise<Contests> => {
  const res = await fetch(
    "https://kenkoooo.com/atcoder/resources/contests.json",
  )
  const contests: Contests = await res.json()
  return contests
}

const getCachedContests = (): CachedContests | undefined => {
  const cachedContestsData = localStorage.getItem("contests")
  if (!cachedContestsData) {
    return undefined
  }
  return JSON.parse(cachedContestsData)
}

const cacheContests = (contests: Contests) => {
  const cachedContests: CachedContests = {
    contests,
    time: Date.now(),
  }
  localStorage.setItem("contests", JSON.stringify(cachedContests))
}
