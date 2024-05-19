export type Contest = {
  id: string
  start_epoch_second: number
  duration_second: number
  title: string
  rate_change: string
}

export type Contests = Contest[]

type CachedContests = {
  contents: Contests
  time: number
}

export const getContests = async () => {
  const now = Date.now()
  const cachedContestsData = localStorage.getItem("contests")
  if (cachedContestsData) {
    const { contents: cachedContests, time }: CachedContests = JSON.parse(
      cachedContestsData,
    )
    if (now - time < 1000 * 3) {
      return cachedContests
    }

    const contents = await fetchContests()
    cacheContests({ contents, time: now })
    return contents
  }

  const contests = await fetchContests()
  cacheContests({ contents: contests, time: now })
  return contests
}

const fetchContests = async () => {
  const res = await fetch(
    "https://kenkoooo.com/atcoder/resources/contests.json",
  )
  const contests: Contests = await res.json()
  return contests
}

const cacheContests = (contests: CachedContests) => {
  localStorage.setItem("contests", JSON.stringify(contests))
}
