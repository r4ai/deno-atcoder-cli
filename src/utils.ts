export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

export type DeepRequired<T> = T extends Record<string, unknown> ? {
    [P in keyof T]-?: DeepRequired<T[P]>
  }
  : T

export const min2ms = (min: number): number => min * 60 * 1000
