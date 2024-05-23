export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

export type DeepRequired<T> = T extends Record<string, unknown> ? {
    [P in keyof T]-?: DeepRequired<T[P]>
  }
  : T

export const min2ms = (min: number): number => min * 60 * 1000

export const getVersion = async (): Promise<string> => {
  const res = await fetch(import.meta.resolve("../deno.jsonc"))
  const json = await res.json()
  return json.version
}
