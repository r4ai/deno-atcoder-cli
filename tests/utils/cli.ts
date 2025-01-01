import { atcoder } from "../../src/cli.ts"
import { stub } from "@std/testing/mock"

export const runAtCoderCli = async (args: string[], cwd?: string) => {
  const cwdStub = cwd ? stub(Deno, "cwd", () => cwd) : undefined
  const res = await atcoder.parse(args)
  cwdStub?.restore()
  return res
}
