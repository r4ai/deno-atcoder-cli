import { fs, path } from "./deps.ts"

export const METADATA_FILE_NAME = "metadata.json" as const

export type Metadata = {
  contest: string
  problem: string
  source: {
    path: string
    compileCommand: string
    executeCommand: string
  }
  tests: { input: string; output: string }[]
}

export const getMetadata = (dir: string): Metadata | undefined => {
  if (!fs.existsSync(dir) || dir === "/") {
    return undefined
  }

  if (fs.existsSync(path.resolve(dir, METADATA_FILE_NAME))) {
    return JSON.parse(
      Deno.readTextFileSync(path.resolve(dir, METADATA_FILE_NAME)),
    )
  }

  const parentDir = path.dirname(dir)
  return getMetadata(parentDir)
}

export const getProblemDir = (dir: string): string | undefined => {
  if (!fs.existsSync(dir) || dir === "/") {
    return undefined
  }

  if (fs.existsSync(path.resolve(dir, METADATA_FILE_NAME))) {
    return dir
  }

  const parentDir = path.dirname(dir)
  return getProblemDir(parentDir)
}
